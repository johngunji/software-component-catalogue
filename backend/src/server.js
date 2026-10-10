require("dotenv").config();

/* ComponentHub REST API
   Express + SQLite

   Layers:
   auth middleware -> route handlers -> SQL
   Prepared statements are used for user input.
*/

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const zlib = require("zlib");

const {
    db,
    hashPassword,
    verifyPassword
} = require("./db");

/* =========================================================
   ZIP ARCHIVE GENERATOR (Native Node.js zlib + CRC-32)
   ========================================================= */

const crc32Table = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crc32Table[i] = c >>> 0;
}

function computeCrc32(buf) {
    if (typeof zlib.crc32 === "function") {
        return zlib.crc32(buf) >>> 0;
    }
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
        crc = (crc >>> 8) ^ crc32Table[(crc ^ buf[i]) & 0xFF];
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createZipArchive(files = []) {
    const localHeaders = [];
    const centralHeaders = [];
    let offset = 0;

    const dosTime = 0x0000;
    const dosDate = 0x5C21; // 2026-01-01

    for (const file of files) {
        let cleanName = String(file.filename || "file.txt").replace(/\\/g, "/").replace(/^\/+/, "");
        if (cleanName.includes("..") || cleanName.includes("\0")) {
            cleanName = cleanName.replace(/[^a-zA-Z0-9._\-\/]/g, "-").replace(/\.\.+/g, "-");
        }
        const nameBuf = Buffer.from(cleanName, "utf8");
        const contentBuf = Buffer.isBuffer(file.content)
            ? file.content
            : Buffer.from(typeof file.content === "string" ? file.content : "", "utf8");

        const isCompressible = contentBuf.length > 0;
        const deflated = isCompressible ? zlib.deflateRawSync(contentBuf) : Buffer.alloc(0);
        const useCompressed = deflated.length < contentBuf.length && isCompressible;
        const finalData = useCompressed ? deflated : contentBuf;
        const compMethod = useCompressed ? 8 : 0;
        const crc = computeCrc32(contentBuf);

        // Info-ZIP Unicode Path Extra Field (0x7075)
        const nameCrc = computeCrc32(nameBuf);
        const extraField = Buffer.alloc(9 + nameBuf.length);
        extraField.writeUInt16LE(0x7075, 0);
        extraField.writeUInt16LE(5 + nameBuf.length, 2);
        extraField.writeUInt8(1, 4);
        extraField.writeUInt32LE(nameCrc >>> 0, 5);
        nameBuf.copy(extraField, 9);

        // General purpose bit flag: 0x0800 (Bit 11: UTF-8)
        const flags = 0x0800;

        // Local Header (30 bytes + nameBuf.length + extraField.length)
        const localHeader = Buffer.alloc(30 + nameBuf.length + extraField.length);
        localHeader.writeUInt32LE(0x04034b50, 0);
        localHeader.writeUInt16LE(20, 4);
        localHeader.writeUInt16LE(flags, 6);
        localHeader.writeUInt16LE(compMethod, 8);
        localHeader.writeUInt16LE(dosTime, 10);
        localHeader.writeUInt16LE(dosDate, 12);
        localHeader.writeUInt32LE(crc >>> 0, 14);
        localHeader.writeUInt32LE(finalData.length, 18);
        localHeader.writeUInt32LE(contentBuf.length, 22);
        localHeader.writeUInt16LE(nameBuf.length, 26);
        localHeader.writeUInt16LE(extraField.length, 28);
        nameBuf.copy(localHeader, 30);
        extraField.copy(localHeader, 30 + nameBuf.length);

        localHeaders.push(localHeader, finalData);

        // Central Directory Header (46 bytes + nameBuf.length + extraField.length)
        const centralHeader = Buffer.alloc(46 + nameBuf.length + extraField.length);
        centralHeader.writeUInt32LE(0x02014b50, 0);
        centralHeader.writeUInt16LE(20, 4);
        centralHeader.writeUInt16LE(20, 6);
        centralHeader.writeUInt16LE(flags, 8);
        centralHeader.writeUInt16LE(compMethod, 10);
        centralHeader.writeUInt16LE(dosTime, 12);
        centralHeader.writeUInt16LE(dosDate, 14);
        centralHeader.writeUInt32LE(crc >>> 0, 16);
        centralHeader.writeUInt32LE(finalData.length, 20);
        centralHeader.writeUInt32LE(contentBuf.length, 24);
        centralHeader.writeUInt16LE(nameBuf.length, 28);
        centralHeader.writeUInt16LE(extraField.length, 30);
        centralHeader.writeUInt16LE(0, 32);
        centralHeader.writeUInt16LE(0, 34);
        centralHeader.writeUInt16LE(0, 36);
        centralHeader.writeUInt32LE(0x81A40000, 38); // file permissions -rw-r--r--
        centralHeader.writeUInt32LE(offset, 42);
        nameBuf.copy(centralHeader, 46);
        extraField.copy(centralHeader, 46 + nameBuf.length);

        centralHeaders.push(centralHeader);
        offset += localHeader.length + finalData.length;
    }

    const centralDirOffset = offset;
    const centralDirBuffer = Buffer.concat(centralHeaders);
    const centralDirSize = centralDirBuffer.length;

    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(0, 4);
    eocd.writeUInt16LE(0, 6);
    eocd.writeUInt16LE(files.length, 8);
    eocd.writeUInt16LE(files.length, 10);
    eocd.writeUInt32LE(centralDirSize, 12);
    eocd.writeUInt32LE(centralDirOffset, 16);
    eocd.writeUInt16LE(0, 20);

    return Buffer.concat([...localHeaders, centralDirBuffer, eocd]);
}



/* =========================================================
   APP CONFIG
   ========================================================= */

const SECRET =
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV === "development" ? "dev-only-secret" : null);

if (!SECRET) {
    throw new Error("Set JWT_SECRET (or NODE_ENV=development for local work)");
}

const app = express();
app.set("trust proxy", 1);


const configuredCorsOrigins = new Set(
    String(process.env.CORS_ORIGIN || "")
        .split(",")
        .map(origin => origin.trim())
        .filter(Boolean)
);

app.use(
    cors({
        origin(origin, callback) {
            if (
                !origin ||
                configuredCorsOrigins.has(origin) ||
                /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)
            ) {
                callback(null, true);
                return;
            }

            callback(new Error("Origin is not allowed by CORS"));
        }
    })
);


app.use(
    express.json({
        limit: "100kb"
    })
);


/* =========================================================
   HELPERS
   ========================================================= */

const bad = (
    message,
    status = 400
) =>
    Object.assign(
        new Error(message),
        { status }
    );


const wrap = fn =>
    (req, res, next) =>
        Promise
            .resolve()
            .then(() => fn(req, res, next))
            .catch(next);


/* =========================================================
   AUTHENTICATION
   ========================================================= */

const authenticate =
    (req, _res, next) => {

        const token =
            (
                req.headers.authorization ||
                ""
            ).replace(
                /^Bearer /,
                ""
            );


        try {

            req.user =
                jwt.verify(
                    token,
                    SECRET
                );

            next();

        } catch {

            next(
                bad(
                    "Authentication required",
                    401
                )
            );

        }

    };


const allow =
    (...roles) =>
    (req, _res, next) => {

        if (
            roles.includes(
                req.user.role
            )
        ) {

            return next();

        }


        next(
            bad(
                "Forbidden for role " +
                req.user.role,
                403
            )
        );

    };


/* =========================================================
   HEALTH
   ========================================================= */

app.get(
    "/health",
    (_req, res) =>
        res.json({ ok: true })
);


/* =========================================================
   LOGIN
   ========================================================= */

const failed = new Map();
const WINDOW = 10 * 60 * 1000;
const LIMIT = 10;
const blocked = ip => {
    const f = failed.get(ip);
    if (!f || Date.now() - f.since > WINDOW) {
        failed.delete(ip);
        return false;
    }
    return f.count >= LIMIT;
};
const recordFailure = ip => {
    const f = failed.get(ip);
    if (!f || Date.now() - f.since > WINDOW) {
        failed.set(ip, { count: 1, since: Date.now() });
    } else {
        f.count++;
    }
};

app.post(
    "/api/auth/login",
    wrap((req, res) => {

        const { username, password } = req.body || {};
        if (blocked(req.ip)) {
            throw bad("Too many failed attempts. Try again in a few minutes.", 429);
        }


        const user =
            typeof username === "string" &&
            typeof password === "string" &&
            db.prepare("SELECT * FROM users WHERE username=?").get(username);


        if (
            !user ||
            !verifyPassword(
                password,
                user.password_hash
            )
        ) {

            recordFailure(req.ip);
            throw bad("Invalid username or password", 401);

        }
        failed.delete(req.ip);


        const token =
            jwt.sign(
                {
                    id: user.id,
                    username: user.username,
                    role: user.role
                },
                SECRET,
                {
                    expiresIn: "8h"
                }
            );


        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });

    })
);


/* =========================================================
   SIGNUP AND EMAIL OTP
   ========================================================= */

const OTP_TTL = 10 * 60 * 1000;
const OTP_ATTEMPT_LIMIT = 5;
const OTP_RESEND_INTERVAL = 60 * 1000;
const signupRate = new Map();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Hash signup tokens and OTP values before storing or comparing them.
const hashSignupValue = value =>
    crypto
        .createHmac("sha256", SECRET)
        .update(value)
        .digest("hex");

// Generate a six-digit verification code for account signup or recovery.
const newOtp = () =>
    String(crypto.randomInt(100000, 1000000));

// Generate an opaque token used to continue a pending signup.
const newSignupToken = () =>
    crypto.randomBytes(32).toString("hex");

// Enforce a minimum delay between repeated signup or OTP requests.
const rateLimited = (key, interval) => {
    const now = Date.now();
    const previous = signupRate.get(key) || 0;
    if (now - previous < interval) return true;
    signupRate.set(key, now);
    return false;
};

// Send a verification code through the configured email provider.
const sendOtpEmail = async (email, otp, subject = "Your ComponentHub verification code") => {
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
        throw bad("Email service is not configured.", 503);
    }

    const response = await fetch(
        process.env.RESEND_API_URL || "https://api.resend.com/emails",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                from: process.env.EMAIL_FROM,
                to: [email],
                subject,
                text: `Your ComponentHub verification code is ${otp}. It expires in 10 minutes.`
            })
        }
    );

    if (!response.ok) {
        throw bad("Unable to send verification email.", 502);
    }
};

const createPendingSignup = db.transaction((signup, otp, token) => {
    db.prepare(`
        INSERT INTO pending_signups(
            signup_token_hash, username, email, password_hash,
            otp_hash, otp_expires_at, last_sent_at, created_at
        )
        VALUES(?,?,?,?,?,?,?,?)
    `).run(
        hashSignupValue(token),
        signup.username,
        signup.email,
        hashPassword(signup.password),
        hashSignupValue(`${token}:${otp}`),
        Date.now() + OTP_TTL,
        Date.now(),
        Date.now()
    );
});

app.post(
    "/api/auth/signup",
    wrap(async (req, res) => {
        const {
            username,
            email,
            password,
            confirmPassword
        } = req.body || {};

        if (
            typeof username !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            typeof confirmPassword !== "string"
        ) {
            throw bad("Username, email, password and password confirmation are required.");
        }

        const cleanUsername = username.trim();
        const cleanEmail = email.trim().toLowerCase();
        if (!cleanUsername) throw bad("Username is required.");
        if (!emailPattern.test(cleanEmail)) throw bad("Enter a valid email address.");
        if (password.length < 8) throw bad("Password must be at least 8 characters.");
        if (password !== confirmPassword) throw bad("Passwords do not match.");
        if (db.prepare("SELECT id FROM users WHERE username=?").get(cleanUsername)) {
            throw bad("Username already exists.", 409);
        }
        if (db.prepare("SELECT id FROM users WHERE email=?").get(cleanEmail)) {
            throw bad("Email already exists.", 409);
        }
        if (rateLimited(`signup:${req.ip}`, OTP_RESEND_INTERVAL)) {
            throw bad("Please wait before requesting another verification code.", 429);
        }

        db.prepare("DELETE FROM pending_signups WHERE username=? OR email=?")
            .run(cleanUsername, cleanEmail);

        const token = newSignupToken();
        const otp = newOtp();
        createPendingSignup(
            { username: cleanUsername, email: cleanEmail, password },
            otp,
            token
        );

        try {
            await sendOtpEmail(cleanEmail, otp);
        } catch (error) {
            db.prepare("DELETE FROM pending_signups WHERE signup_token_hash=?")
                .run(hashSignupValue(token));
            throw error;
        }

        res.status(202).json({
            message: "Verification code sent.",
            signupToken: token,
            email: cleanEmail
        });
    })
);

app.post(
    "/api/auth/signup/resend",
    wrap(async (req, res) => {
        const { signupToken } = req.body || {};
        if (typeof signupToken !== "string" || !signupToken) {
            throw bad("Signup verification is required.");
        }
        if (rateLimited(`resend:${req.ip}`, OTP_RESEND_INTERVAL)) {
            throw bad("Please wait before requesting another verification code.", 429);
        }

        const signup = db.prepare(`
            SELECT * FROM pending_signups WHERE signup_token_hash=?
        `).get(hashSignupValue(signupToken));
        if (!signup) throw bad("Signup verification is invalid or expired.", 400);

        const otp = newOtp();
        await sendOtpEmail(signup.email, otp);
        db.prepare(`
            UPDATE pending_signups
            SET otp_hash=?, otp_expires_at=?, otp_attempts=0, last_sent_at=?
            WHERE id=?
        `).run(
            hashSignupValue(`${signupToken}:${otp}`),
            Date.now() + OTP_TTL,
            Date.now(),
            signup.id
        );
        res.json({ message: "Verification code resent.", email: signup.email });
    })
);

app.post(
    "/api/auth/signup/verify",
    wrap((req, res) => {
        const { signupToken, otp } = req.body || {};
        if (typeof signupToken !== "string" || !/^\d{6}$/.test(String(otp))) {
            throw bad("Enter the 6-digit verification code.");
        }

        const signup = db.prepare(`
            SELECT * FROM pending_signups WHERE signup_token_hash=?
        `).get(hashSignupValue(signupToken));
        if (!signup) throw bad("Signup verification is invalid or expired.", 400);
        if (signup.otp_expires_at < Date.now()) {
            db.prepare("DELETE FROM pending_signups WHERE id=?").run(signup.id);
            throw bad("Verification code has expired.", 400);
        }
        if (signup.otp_attempts >= OTP_ATTEMPT_LIMIT) {
            throw bad("Too many incorrect verification attempts.", 429);
        }

        const expected = Buffer.from(signup.otp_hash, "hex");
        const actual = Buffer.from(hashSignupValue(`${signupToken}:${otp}`), "hex");
        db.prepare("UPDATE pending_signups SET otp_attempts=otp_attempts+1 WHERE id=?")
            .run(signup.id);
        if (
            expected.length !== actual.length ||
            !crypto.timingSafeEqual(expected, actual)
        ) {
            throw bad("Incorrect verification code.", 400);
        }

        const result = db.transaction(() => {
            if (db.prepare("SELECT id FROM users WHERE username=? OR email=?")
                .get(signup.username, signup.email)) {
                throw bad("Username or email already exists.", 409);
            }
            const created = db.prepare(`
                INSERT INTO users(username, email, password_hash, role)
                VALUES(?,?,?,?)
            `).run(signup.username, signup.email, signup.password_hash, "user");
            db.prepare("DELETE FROM pending_signups WHERE id=?").run(signup.id);
            return created;
        })();

        res.status(201).json({
            message: "Account created successfully.",
            user: {
                id: result.lastInsertRowid,
                username: signup.username,
                email: signup.email,
                role: "user"
            }
        });
    })
);


/* =========================================================
   PASSWORD RESET
   ========================================================= */

// Generate a short-lived password-reset token.
const resetToken = () =>
    crypto.randomBytes(32).toString("hex");

const genericResetMessage =
    "If an account exists for this email, a verification code has been sent.";

app.post(
    "/api/auth/forgot-password",
    wrap(async (req, res) => {
        const email =
            typeof req.body?.email === "string"
                ? req.body.email.trim().toLowerCase()
                : "";

        if (!emailPattern.test(email)) {
            throw bad("Enter a valid email address.");
        }

        if (rateLimited(`forgot:${req.ip}`, OTP_RESEND_INTERVAL)) {
            throw bad("Please wait before requesting another verification code.", 429);
        }

        const user = db.prepare(`
            SELECT id, email FROM users WHERE email=?
        `).get(email);
        const token = resetToken();

        if (user) {
            db.prepare("DELETE FROM password_resets WHERE user_id=?").run(user.id);

            const otp = newOtp();
            db.prepare(`
                INSERT INTO password_resets(
                    user_id, email, reset_token_hash, otp_hash,
                    otp_expires_at, last_sent_at, created_at
                )
                VALUES(?,?,?,?,?,?,?)
            `).run(
                user.id,
                user.email,
                hashSignupValue(token),
                hashSignupValue(`${token}:${otp}`),
                Date.now() + OTP_TTL,
                Date.now(),
                Date.now()
            );

            try {
                await sendOtpEmail(
                    user.email,
                    otp,
                    "Reset your ComponentHub password"
                );
            } catch (error) {
                db.prepare("DELETE FROM password_resets WHERE user_id=?").run(user.id);
                throw error;
            }

            return res.status(202).json({
                message: genericResetMessage,
                resetToken: token,
                email: user.email
            });
        }

        res.status(202).json({
            message: genericResetMessage,
            resetToken: token,
            email
        });
    })
);

app.post(
    "/api/auth/forgot-password/resend",
    wrap(async (req, res) => {
        const { resetToken: token } = req.body || {};
        if (typeof token !== "string" || !token) {
            throw bad("Password reset is invalid or expired.", 400);
        }
        if (rateLimited(`reset-resend:${req.ip}`, OTP_RESEND_INTERVAL)) {
            throw bad("Please wait before requesting another verification code.", 429);
        }

        const reset = db.prepare(`
            SELECT * FROM password_resets WHERE reset_token_hash=?
        `).get(hashSignupValue(token));
        if (!reset) throw bad("Password reset is invalid or expired.", 400);

        const otp = newOtp();
        await sendOtpEmail(
            reset.email,
            otp,
            "Reset your ComponentHub password"
        );
        db.prepare(`
            UPDATE password_resets
            SET otp_hash=?, otp_expires_at=?, otp_attempts=0, last_sent_at=?
            WHERE id=?
        `).run(
            hashSignupValue(`${token}:${otp}`),
            Date.now() + OTP_TTL,
            Date.now(),
            reset.id
        );

        res.json({
            message: "A new verification code has been sent.",
            email: reset.email
        });
    })
);

app.post(
    "/api/auth/reset-password",
    wrap((req, res) => {
        const {
            resetToken: token,
            otp,
            password,
            confirmPassword
        } = req.body || {};

        if (typeof token !== "string" || !token) {
            throw bad("Password reset is invalid or expired.", 400);
        }
        if (!/^\d{6}$/.test(String(otp))) {
            throw bad("Enter the 6-digit verification code.");
        }
        if (typeof password !== "string" || password.length < 8) {
            throw bad("Password must be at least 8 characters.");
        }
        if (password !== confirmPassword) {
            throw bad("Passwords do not match.");
        }

        const reset = db.prepare(`
            SELECT * FROM password_resets WHERE reset_token_hash=?
        `).get(hashSignupValue(token));
        if (!reset) throw bad("Password reset is invalid or expired.", 400);
        if (reset.otp_expires_at < Date.now()) {
            db.prepare("DELETE FROM password_resets WHERE id=?").run(reset.id);
            throw bad("Verification code has expired.", 400);
        }
        if (reset.otp_attempts >= OTP_ATTEMPT_LIMIT) {
            throw bad("Too many incorrect verification attempts.", 429);
        }

        const expected = Buffer.from(reset.otp_hash, "hex");
        const actual = Buffer.from(hashSignupValue(`${token}:${otp}`), "hex");
        db.prepare("UPDATE password_resets SET otp_attempts=otp_attempts+1 WHERE id=?")
            .run(reset.id);
        if (
            expected.length !== actual.length ||
            !crypto.timingSafeEqual(expected, actual)
        ) {
            throw bad("Incorrect verification code.", 400);
        }

        db.transaction(() => {
            db.prepare("UPDATE users SET password_hash=? WHERE id=?")
                .run(hashPassword(password), reset.user_id);
            db.prepare("DELETE FROM password_resets WHERE id=?").run(reset.id);
        })();

        res.json({ message: "Password reset successfully." });
    })
);


/* =========================================================
   EVERYTHING BELOW REQUIRES AUTH
   ========================================================= */

app.use(
    "/api",
    authenticate
);


app.get(
    "/api/me",
    (req, res) =>
        res.json(req.user)
);


/* =========================================================
   CATEGORY HELPERS
   ========================================================= */

// Build a category lookup map for API filtering and validation.
const catMap = () =>
    new Map(
        db
            .prepare(`
                SELECT
                    id,
                    name,
                    parent_id
                FROM categories
            `)
            .all()
            .map(
                category =>
                    [category.id, category]
            )
    );


const pathOf = (
    map,
    id
) => {

    const category =
        map.get(id);


    return category

        ? (
            category.parent_id
                ? pathOf(
                    map,
                    category.parent_id
                ) + " › "
                : ""
        ) + category.name

        : "";

};


const subtree = (
    map,
    id
) => {

    return [
        id,

        ...[
            ...map.values()
        ]
            .filter(
                category =>
                    category.parent_id === id
            )
            .flatMap(
                category =>
                    subtree(
                        map,
                        category.id
                    )
            )
    ];

};


/* =========================================================
   HYDRATE DATABASE ROWS
   INTO FRONTEND DATA MODEL
   ========================================================= */

// Convert database rows into the public component API shape.
function hydrate(rows) {

    if (!rows.length) {
        return [];
    }


    const map = catMap();

    const ids =
        rows.map(
            row => row.id
        );


    const keywordsByComponent = {};


    db.prepare(`
        SELECT
            ck.component_id AS id,
            k.word
        FROM component_keywords ck
        JOIN keywords k
            ON k.id = ck.keyword_id
        WHERE ck.component_id
            IN (${ids.map(() => "?").join()})
        ORDER BY k.word
    `)
        .all(...ids)
        .forEach(row => {

            (
                keywordsByComponent[row.id] ??= []
            ).push(row.word);

        });


    const artifactsByComponent = {};
    db.prepare(`
        SELECT *
        FROM component_artifacts
        WHERE component_id IN (${ids.map(() => "?").join()})
        ORDER BY sort_order, id
    `).all(...ids).forEach(artifact => {
        (artifactsByComponent[artifact.component_id] ??= []).push({
            id: artifact.id,
            name: artifact.name,
            description: artifact.description,
            variantType: artifact.variant_type,
            deliveryMethod: artifact.delivery_method,
            artifactFormat: artifact.artifact_format,
            content: artifact.content,
            binaryContent: artifact.binary_content ? artifact.binary_content.toString("base64") : null,
            contentType: artifact.content_type,
            downloadFilename: artifact.download_filename,
            reuseMethod: artifact.reuse_method,
            isPrimary: Boolean(artifact.is_primary),
            sortOrder: artifact.sort_order,
            createdAt: artifact.created_at
        });
    });

    return rows.map(row => ({

        id: row.id,

        name: row.name,

        description:
            row.description,

        categoryId:
            row.category_id,

        categoryPath:
            pathOf(
                map,
                row.category_id
            ),

        type:
            row.type,

        language:
            row.type === "Code"
                ? row.tech
                : null,

        notation:
            row.type === "Design"
                ? row.tech
                : null,

        keywords:
            keywordsByComponent[row.id] ||
            [],

        url:
            row.url,

        artifactFormat: row.artifact_format || "",
        artifactContent: row.artifact_content || "",
        usageNotes: row.usage_notes || "",
        exampleContent: row.example_content || "",
        deliveryMethod: row.delivery_method || "",
        reuseMethod: row.reuse_method || "",
        installCommand: row.install_command || "",
        artifacts: artifactsByComponent[row.id] || [],

        usage: {
            used:
                row.used_count,

            queriedNotUsed:
                row.queried_not_used_count
        },

        addedOn:
            row.added_on

    }));

}


/* =========================================================
   SEARCH SQL
   ========================================================= */

const HAY = `
    lower(
        c.name ||
        ' ' ||
        c.description ||
        ' ' ||
        c.type ||
        ' ' ||
        c.tech ||
        ' ' ||
        (
            SELECT name
            FROM categories
            WHERE id = c.category_id
        ) ||
        ' ' ||
        coalesce(
            (
                SELECT group_concat(
                    k.word,
                    ' '
                )
                FROM component_keywords ck
                JOIN keywords k
                    ON k.id = ck.keyword_id
                WHERE ck.component_id = c.id
            ),
            ''
        )
    )
`;


const ORDER = {

    name:
        "c.name COLLATE NOCASE",

    usage:
        "c.used_count DESC, c.name",

    new:
        "c.added_on DESC, c.id DESC"

};


/* =========================================================
   FIND COMPONENTS
   ========================================================= */

// Filter and rank catalogue components for browse and search endpoints.
function find({
    q = "",
    category,
    type,
    tech,
    sort = "name"
}) {

    const where = [];
    const args = [];


    for (
        const word of String(q)
            .toLowerCase()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 8)
    ) {

        where.push(
            `${HAY} LIKE ? ESCAPE '\\'`
        );


        args.push(
            "%" +
            word.replace(
                /[\\%_]/g,
                "\\$&"
            ) +
            "%"
        );

    }


    if (category) {

        const map = catMap();

        const id =
            Number(category);


        if (map.has(id)) {

            const ids =
                subtree(
                    map,
                    id
                );


            where.push(
                `c.category_id IN (${ids.join()})`
            );

        } else {

            where.push("0");

        }

    }


    if (type) {

        where.push(
            "c.type=?"
        );

        args.push(
            String(type)
        );

    }


    if (tech) {

        where.push(
            "c.tech=? COLLATE NOCASE"
        );

        args.push(
            String(tech)
        );

    }


    const sql = `
        SELECT c.*
        FROM components c

        ${
            where.length
                ? "WHERE " +
                  where.join(" AND ")
                : ""
        }

        ORDER BY ${
            ORDER[sort] ||
            ORDER.name
        }
    `;


    return hydrate(
        db.prepare(sql)
            .all(...args)
    );

}


/* =========================================================
   COMPONENT INPUT VALIDATION
   ========================================================= */

// Validate and normalize a create or update component request body.
function parseComponent(
    body = {}
) {

    const stringValue = (
        value,
        max
    ) =>
        (
            typeof value === "string"
                ? value.trim().slice(0, max)
                : ""
        );


    const component = {

        name:
            stringValue(
                body.name,
                120
            ),

        description:
            stringValue(
                body.description,
                2000
            ),

        type:
            body.type,

        tech:
            stringValue(
                body.tech ??
                body.language ??
                body.notation,
                60
            ),

        url:
            stringValue(
                body.url,
                300
            ),

        artifactFormat:
            stringValue(body.artifactFormat ?? body.artifact_format, 30),

        artifactContent:
            stringValue(body.artifactContent ?? body.artifact_content, 12000),

        usageNotes:
            stringValue(body.usageNotes ?? body.usage_notes, 2000),

        exampleContent:
            stringValue(body.exampleContent ?? body.example_content, 6000),

        deliveryMethod:
            stringValue(body.deliveryMethod ?? body.delivery_method, 60),

        reuseMethod:
            stringValue(body.reuseMethod ?? body.reuse_method, 60),

        installCommand:
            stringValue(body.installCommand ?? body.install_command, 300),

        categoryId:
            Number(
                body.categoryId
            )

    };


    if (
        !component.name ||
        !component.description
    ) {

        throw bad(
            "name and description are required"
        );

    }

    if (
        component.type === "Design" &&
        !component.artifactContent
    ) {
        throw bad("design components require reusable artifact content");
    }

    if (
        component.artifactFormat &&
        ![
            "snippet", "file", "package", "mermaid", "plantuml", "drawio", "svg", "png", "markdown",
            "javascript", "typescript", "python", "json", "yaml", "txt", "html", "css", "sql", "sh", "bash",
            "go", "rust", "java", "c", "cpp", "csharp", "php", "ruby", "dockerfile", "xml"
        ].includes(component.artifactFormat.toLowerCase())
    ) {
        throw bad("Unsupported component artifact format");
    }


    if (
        ![
            "Code",
            "Design"
        ].includes(
            component.type
        )
    ) {

        throw bad(
            "type must be 'Code' or 'Design'"
        );

    }


    if (
        !catMap().has(
            component.categoryId
        )
    ) {

        throw bad(
            "unknown categoryId"
        );

    }


    if (
        component.url &&
        !/^https?:\/\//i.test(
            component.url
        )
    ) {

        throw bad(
            "url must start with http:// or https://"
        );

    }


    return component;
}

// Validate the supported text artifact formats and safe download filename.
function parseArtifact(body = {}) {
    const allowed = [
        "mermaid", "plantuml", "drawio", "svg", "png", "markdown",
        "javascript", "typescript", "python", "json", "yaml", "txt",
        "html", "css", "sql", "sh", "bash", "go", "rust", "java",
        "c", "cpp", "csharp", "php", "ruby", "dockerfile", "xml"
    ];
    const extensions = {
        mermaid: [".mmd", ".mermaid"],
        plantuml: [".puml", ".plantuml"],
        drawio: [".drawio", ".xml"],
        svg: [".svg"],
        png: [".png"],
        markdown: [".md", ".markdown"],
        javascript: [".js", ".mjs", ".cjs"],
        typescript: [".ts", ".tsx"],
        python: [".py"],
        json: [".json"],
        yaml: [".yaml", ".yml"],
        txt: [".txt", ".keep", ".text", ".gitignore", ".env", ".dockerignore", ""],
        html: [".html", ".htm"],
        css: [".css", ".scss", ".sass", ".less"],
        sql: [".sql"],
        sh: [".sh"],
        bash: [".bash", ".sh"],
        go: [".go"],
        rust: [".rs"],
        java: [".java"],
        c: [".c", ".h"],
        cpp: [".cpp", ".hpp", ".cc", ".cxx"],
        csharp: [".cs"],
        php: [".php"],
        ruby: [".rb"],
        dockerfile: [".dockerfile", "dockerfile", ".dockerignore"],
        xml: [".xml"]
    };

    let rawFilename = typeof body.downloadFilename === "string" ? body.downloadFilename.trim().replace(/\\/g, "/") : "";
    if (rawFilename.includes("..") || rawFilename.includes("\0")) {
        throw bad("Directory traversal in downloadFilename is not allowed");
    }
    const pathParts = rawFilename.split("/").map(p => p.trim().replace(/[\\/\0:\*\?"<>\|]/g, "-")).filter(Boolean);
    const cleanFilename = pathParts.join("/").slice(0, 240);

    const artifact = {
        name: typeof body.name === "string" ? body.name.trim().slice(0, 120) : "",
        description: typeof body.description === "string" ? body.description.trim().slice(0, 2000) : "",
        variantType: typeof body.variantType === "string" ? body.variantType.trim().slice(0, 80) : "",
        deliveryMethod: typeof body.deliveryMethod === "string" ? body.deliveryMethod.trim().slice(0, 80) : "",
        artifactFormat: typeof body.artifactFormat === "string" ? body.artifactFormat.trim().toLowerCase() : "",
        content: typeof body.content === "string" ? body.content : "",
        binaryContent: typeof body.binaryContent === "string" ? body.binaryContent : "",
        contentType: typeof body.contentType === "string" ? body.contentType.slice(0, 120) : "",
        downloadFilename: cleanFilename,
        reuseMethod: typeof body.reuseMethod === "string" ? body.reuseMethod.trim().slice(0, 120) : "",
        isPrimary: body.isPrimary ? 1 : 0,
        sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0
    };
    if (!artifact.name || !artifact.description || !artifact.variantType ||
        !artifact.deliveryMethod || (typeof body.content !== "string" && !artifact.binaryContent) || !artifact.downloadFilename ||
        !artifact.reuseMethod) {
        throw bad("Artifact name, description, variant, delivery, content, filename, and reuse method are required");
    }
    if (!allowed.includes(artifact.artifactFormat)) {
        throw bad(`Unsupported artifact format. Use one of: ${allowed.join(", ")}`);
    }
    if (artifact.content.length > 500000 || artifact.binaryContent.length > 700000) {
        throw bad("Artifact content is too large", 413);
    }
    const basename = artifact.downloadFilename.split("/").pop() || "";
    const extension = basename.includes(".")
        ? (basename.startsWith(".") && !basename.slice(1).includes(".") ? basename.toLowerCase() : `.${basename.split(".").pop().toLowerCase()}`)
        : (basename.toLowerCase() === "dockerfile" ? "dockerfile" : "");
    if (extensions[artifact.artifactFormat] && !extensions[artifact.artifactFormat].includes(extension)) {
        throw bad(`Filename extension must match ${artifact.artifactFormat}: ${extensions[artifact.artifactFormat].join(", ")}`);
    }
    if (artifact.artifactFormat === "png") {
        if (!artifact.binaryContent) throw bad("PNG artifacts require binary content");
        let bytes;
        try {
            bytes = Buffer.from(artifact.binaryContent, "base64");
        } catch {
            throw bad("PNG binary content is not valid base64");
        }
        if (bytes.length < 8 || bytes.readUInt32BE(0) !== 0x89504e47) {
            throw bad("PNG artifacts must contain a valid PNG file");
        }
        artifact.content = "";
        artifact.contentType = "image/png";
    }
    if (artifact.artifactFormat === "svg" && !/<svg[\s>]/i.test(artifact.content)) {
        throw bad("SVG artifacts must contain an <svg> root element");
    }
    if (artifact.artifactFormat === "drawio" && !/<mxfile[\s>]/i.test(artifact.content)) {
        throw bad("Draw.io artifacts must contain an <mxfile> root element");
    }
    if (artifact.artifactFormat === "json") {
        try {
            JSON.parse(artifact.content);
        } catch {
            throw bad("JSON artifacts must contain valid JSON");
        }
    }
    return artifact;
}


/* =========================================================
   KEYWORDS
   ========================================================= */

const parseKeywords =
    value => {

        const values =
            Array.isArray(value)
                ? value
                : String(
                    value ?? ""
                ).split(",");


        return [
            ...new Map(

                values
                    .map(
                        keyword =>
                            String(keyword)
                                .trim()
                                .slice(0, 40)
                    )
                    .filter(Boolean)
                    .map(
                        keyword => [
                            keyword.toLowerCase(),
                            keyword
                        ]
                    )

            ).values()

        ].slice(0, 20);

    };


const setKeywords =
    db.transaction(
        (
            componentId,
            words
        ) => {

            db.prepare(`
                DELETE FROM
                    component_keywords
                WHERE component_id=?
            `).run(componentId);


            for (
                const word of words
            ) {

                db.prepare(`
                    INSERT OR IGNORE INTO
                        keywords(word)
                    VALUES(?)
                `).run(word);


                const keyword =
                    db.prepare(`
                        SELECT id
                        FROM keywords
                        WHERE word=?
                    `).get(word);


                db.prepare(`
                    INSERT OR IGNORE INTO
                        component_keywords
                    VALUES(?,?)
                `).run(
                    componentId,
                    keyword.id
                );

            }

        }
    );


/* =========================================================
   404 COMPONENT
   ========================================================= */

const getOr404 =
    id => {

        const componentId = Number(id);

        if (!Number.isInteger(componentId) || componentId <= 0) {
            throw bad(
                "invalid component id"
            );
        }

        const row =
            db.prepare(`
                SELECT *
                FROM components
                WHERE id=?
            `).get(
                componentId
            );


        if (!row) {

            throw bad(
                "Component not found",
                404
            );

        }


        return row;

    };


/* =========================================================
   CATEGORIES
   ========================================================= */

app.get(
    "/api/categories",
    wrap((_req, res) => {

        const map =
            catMap();


        res.json(
            [
                ...map.values()
            ].map(category => ({

                id:
                    category.id,

                name:
                    category.name,

                parentId:
                    category.parent_id,

                path:
                    pathOf(
                        map,
                        category.id
                    ),

                componentCount:
                    db.prepare(`
                        SELECT COUNT(*) AS n
                        FROM components
                        WHERE category_id
                            IN (
                                ${subtree(
                                    map,
                                    category.id
                                ).join()}
                            )
                    `).get().n

            }))
        );

    })
);


app.post(
    "/api/categories",
    allow("cataloguer"),

    wrap((req, res) => {

        const name =
            String(
                req.body?.name ?? ""
            )
                .trim()
                .slice(0, 60);


        const parent =
            req.body?.parentId ??
            null;


        if (!name) {

            throw bad(
                "name is required"
            );

        }


        if (
            parent !== null &&
            !catMap().has(
                Number(parent)
            )
        ) {

            throw bad(
                "unknown parentId"
            );

        }


        try {

            const id =
                db.prepare(`
                    INSERT INTO categories(
                        name,
                        parent_id
                    )
                    VALUES(?,?)
                `).run(
                    name,
                    parent === null
                        ? null
                        : Number(parent)
                ).lastInsertRowid;


            res.status(201).json({

                id,

                name,

                parentId:
                    parent

            });

        } catch (error) {

            throw (
                error.code ===
                "SQLITE_CONSTRAINT_UNIQUE"

                    ? bad(
                        "Category already exists",
                        409
                    )

                    : error
            );

        }

    })
);


app.delete(
    "/api/categories/:id",
    allow("cataloguer"),

    wrap((req, res) => {

        const id =
            Number(
                req.params.id
            );


        if (
            !catMap().has(id)
        ) {

            throw bad(
                "Category not found",
                404
            );

        }


        if (
            db.prepare(`
                SELECT 1
                FROM categories
                WHERE parent_id=?
            `).get(id)

            ||

            db.prepare(`
                SELECT 1
                FROM components
                WHERE category_id=?
            `).get(id)
        ) {

            throw bad(
                "Category is not empty",
                409
            );

        }


        db.prepare(`
            DELETE FROM categories
            WHERE id=?
        `).run(id);


        res.status(204).end();

    })
);


/* =========================================================
   COMPONENTS
   ========================================================= */

app.get(
    "/api/components",
    wrap((req, res) => {

        res.json(
            find(req.query)
        );

    })
);


app.get(
    "/api/components/:id",

    wrap((req, res) => {

        res.json(
            hydrate([
                getOr404(
                    req.params.id
                )
            ])[0]
        );

    })
);

app.get(
    "/api/components/:id/artifacts",
    wrap((req, res) => {
        getOr404(req.params.id);
        res.json(db.prepare(`
            SELECT id, component_id AS componentId, name, description,
                   variant_type AS variantType, delivery_method AS deliveryMethod,
                   artifact_format AS artifactFormat, content,
                   binary_content AS binaryContent, content_type AS contentType,
                   download_filename AS downloadFilename,
                   reuse_method AS reuseMethod, is_primary AS isPrimary,
                   sort_order AS sortOrder, created_at AS createdAt
            FROM component_artifacts
            WHERE component_id=?
            ORDER BY sort_order, id
        `).all(Number(req.params.id)).map(artifact => ({
            ...artifact,
            binaryContent: artifact.binaryContent ? Buffer.from(artifact.binaryContent).toString("base64") : null,
            isPrimary: Boolean(artifact.isPrimary)
        })));
    })
);

app.get(
    "/api/components/:id/zip",
    wrap((req, res) => {
        const component = getOr404(req.params.id);
        const artifacts = db.prepare(`
            SELECT id, name, artifact_format, content, binary_content, download_filename
            FROM component_artifacts
            WHERE component_id=?
            ORDER BY sort_order ASC, id ASC
        `).all(Number(req.params.id));

        const files = [];
        if (artifacts && artifacts.length > 0) {
            for (const art of artifacts) {
                const filename = art.download_filename || art.name || `artifact-${art.id}.txt`;
                const content = art.binary_content || art.content || "";
                files.push({ filename, content });
            }
        } else if (component.artifact_content) {
            const extMap = {
                javascript: "js", typescript: "ts", python: "py", json: "json", yaml: "yaml",
                markdown: "md", mermaid: "mmd", plantuml: "puml", drawio: "drawio", svg: "svg", html: "html", css: "css", txt: "txt"
            };
            const ext = extMap[component.artifact_format] || "txt";
            const filename = `${(component.name || "component").toLowerCase().replace(/[^a-z0-9._-]/g, "-")}.${ext}`;
            files.push({ filename, content: component.artifact_content });
        }

        if (files.length === 0) {
            throw bad("No downloadable files available for this component", 404);
        }

        const zipBuffer = createZipArchive(files);

        db.prepare(`
            UPDATE components
            SET used_count=used_count+1,
                queried_not_used_count=MAX(0, queried_not_used_count-1)
            WHERE id=?
        `).run(Number(req.params.id));

        let baseName = (component.name || `component-${req.params.id}`)
            .toLowerCase()
            .replace(/[^a-z0-9._-]/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");
        if (!baseName) baseName = `component-${req.params.id}`;

        res.set("Content-Type", "application/zip");
        res.attachment(`${baseName}.zip`);
        res.send(zipBuffer);
    })
);

app.get(
    "/api/components/:id/artifacts/:artifactId/download",
    wrap((req, res) => {
        getOr404(req.params.id);
        const artifact = db.prepare(`
            SELECT artifact_format, content, binary_content, content_type,
                   download_filename
            FROM component_artifacts
            WHERE id=? AND component_id=?
        `).get(Number(req.params.artifactId), Number(req.params.id));
        if (!artifact) throw bad("Artifact not found", 404);
        db.prepare(`
            UPDATE components
            SET used_count=used_count+1,
                queried_not_used_count=MAX(0, queried_not_used_count-1)
            WHERE id=?
        `).run(Number(req.params.id));
        const contentTypes = {
            mermaid: "text/plain; charset=utf-8",
            plantuml: "text/plain; charset=utf-8",
            markdown: "text/markdown; charset=utf-8",
            drawio: "application/xml; charset=utf-8",
            svg: "image/svg+xml",
            png: "image/png",
            javascript: "text/javascript; charset=utf-8",
            typescript: "text/typescript; charset=utf-8",
            python: "text/x-python; charset=utf-8",
            json: "application/json; charset=utf-8",
            yaml: "text/yaml; charset=utf-8",
            txt: "text/plain; charset=utf-8",
            html: "text/html; charset=utf-8",
            css: "text/css; charset=utf-8",
            sql: "text/plain; charset=utf-8",
            sh: "text/plain; charset=utf-8",
            bash: "text/plain; charset=utf-8",
            go: "text/plain; charset=utf-8",
            rust: "text/plain; charset=utf-8",
            java: "text/plain; charset=utf-8",
            c: "text/plain; charset=utf-8",
            cpp: "text/plain; charset=utf-8",
            csharp: "text/plain; charset=utf-8",
            php: "text/plain; charset=utf-8",
            ruby: "text/plain; charset=utf-8",
            xml: "application/xml; charset=utf-8"
        };
        res.attachment(artifact.download_filename);
        res.set("Content-Type", contentTypes[artifact.artifact_format] || artifact.content_type || "application/octet-stream");
        res.send(artifact.binary_content || artifact.content);
    })
);

app.post(
    "/api/components/:id/artifacts",
    allow("cataloguer"),
    wrap((req, res) => {
        const componentId = Number(req.params.id);
        getOr404(componentId);
        const artifact = parseArtifact(req.body);
        const values = [artifact.name, artifact.description, artifact.variantType, artifact.deliveryMethod,
            artifact.artifactFormat, artifact.content, artifact.downloadFilename, artifact.reuseMethod];
        const result = db.prepare(`
            INSERT INTO component_artifacts(
                component_id, name, description, variant_type, delivery_method,
                artifact_format, content, binary_content, content_type,
                download_filename, reuse_method, is_primary, sort_order
            ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)
        `).run(componentId, ...values.slice(0, 5), artifact.content, artifact.binaryContent ? Buffer.from(artifact.binaryContent, "base64") : null,
            artifact.contentType || "text/plain", ...values.slice(6), artifact.isPrimary, artifact.sortOrder);
        const created = db.prepare(`
            SELECT id, component_id AS componentId, name, description,
                   variant_type AS variantType, delivery_method AS deliveryMethod,
                   artifact_format AS artifactFormat, content,
                   binary_content AS binaryContent, content_type AS contentType,
                   download_filename AS downloadFilename,
                   reuse_method AS reuseMethod, is_primary AS isPrimary,
                   sort_order AS sortOrder, created_at AS createdAt
            FROM component_artifacts WHERE id=?
        `).get(result.lastInsertRowid);
        if (created.binaryContent) created.binaryContent = Buffer.from(created.binaryContent).toString("base64");
        res.status(201).json(created);
    })
);

app.put(
    "/api/components/:id/artifacts/reorder",
    allow("cataloguer"),
    wrap((req, res) => {
        const componentId = Number(req.params.id);
        getOr404(componentId);
        const order = Array.isArray(req.body.order)
            ? req.body.order
            : Array.isArray(req.body.artifacts)
                ? req.body.artifacts.map(a => a.id)
                : null;

        if (!order || !Array.isArray(order)) {
            throw bad("Order array of artifact IDs is required");
        }

        const updateStmt = db.prepare(`
            UPDATE component_artifacts
            SET sort_order=?
            WHERE id=? AND component_id=?
        `);

        db.transaction(() => {
            order.forEach((artId, idx) => {
                updateStmt.run(idx, Number(artId), componentId);
            });
        })();

        const updated = db.prepare(`
            SELECT id, component_id AS componentId, name, description,
                   variant_type AS variantType, delivery_method AS deliveryMethod,
                   artifact_format AS artifactFormat, content,
                   binary_content AS binaryContent, content_type AS contentType,
                   download_filename AS downloadFilename,
                   reuse_method AS reuseMethod, is_primary AS isPrimary,
                   sort_order AS sortOrder, created_at AS createdAt
            FROM component_artifacts
            WHERE component_id=?
            ORDER BY sort_order, id
        `).all(componentId).map(artifact => ({
            ...artifact,
            binaryContent: artifact.binaryContent ? Buffer.from(artifact.binaryContent).toString("base64") : null,
            isPrimary: Boolean(artifact.isPrimary)
        }));

        res.json(updated);
    })
);

app.put(
    "/api/components/:id/artifacts/:artifactId",
    allow("cataloguer"),
    wrap((req, res) => {
        const componentId = Number(req.params.id);
        const artifactId = Number(req.params.artifactId);
        getOr404(componentId);
        const artifact = parseArtifact(req.body);
        const values = [artifact.name, artifact.description, artifact.variantType, artifact.deliveryMethod,
            artifact.artifactFormat, artifact.content, artifact.downloadFilename, artifact.reuseMethod];
        const result = db.prepare(`
            UPDATE component_artifacts
            SET name=?, description=?, variant_type=?, delivery_method=?,
                artifact_format=?, content=?, binary_content=?, content_type=?, download_filename=?,
                reuse_method=?, is_primary=?, sort_order=?
            WHERE id=? AND component_id=?
        `).run(artifact.name, artifact.description, artifact.variantType, artifact.deliveryMethod,
            artifact.artifactFormat, artifact.content,
            artifact.binaryContent ? Buffer.from(artifact.binaryContent, "base64") : null,
            artifact.contentType || null, artifact.downloadFilename, artifact.reuseMethod,
            artifact.isPrimary, artifact.sortOrder, artifactId, componentId);
        if (!result.changes) throw bad("Artifact not found", 404);
        const updated = db.prepare(`
            SELECT id, component_id AS componentId, name, description,
                   variant_type AS variantType, delivery_method AS deliveryMethod,
                   artifact_format AS artifactFormat, content,
                   binary_content AS binaryContent, content_type AS contentType,
                   download_filename AS downloadFilename,
                   reuse_method AS reuseMethod, is_primary AS isPrimary,
                   sort_order AS sortOrder, created_at AS createdAt
            FROM component_artifacts WHERE id=?
        `).get(artifactId);
        if (updated.binaryContent) updated.binaryContent = Buffer.from(updated.binaryContent).toString("base64");
        res.json(updated);
    })
);

app.delete(
    "/api/components/:id/artifacts/:artifactId",
    allow("cataloguer"),
    wrap((req, res) => {
        getOr404(req.params.id);
        const result = db.prepare(`
            DELETE FROM component_artifacts
            WHERE id=? AND component_id=?
        `).run(Number(req.params.artifactId), Number(req.params.id));
        if (!result.changes) throw bad("Artifact not found", 404);
        res.status(204).end();
    })
);


app.post(
    "/api/components",
    allow("cataloguer"),

    wrap((req, res) => {

        const component =
            parseComponent(
                req.body
            );


        const keywords =
            parseKeywords(
                req.body.keywords
            );


        const id =
            db.transaction(() => {

                const result =
                    db.prepare(`
                        INSERT INTO components(
                            name,
                            description,
                            category_id,
                            type,
                            tech,
                            url,
                            artifact_format,
                            artifact_content,
                            usage_notes,
                            example_content,
                            delivery_method,
                            reuse_method,
                            install_command,
                            created_by
                        )
                        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                    `).run(
                        component.name,
                        component.description,
                        component.categoryId,
                        component.type,
                        component.tech,
                        component.url,
                        component.artifactFormat,
                        component.artifactContent,
                        component.usageNotes,
                        component.exampleContent,
                        component.deliveryMethod,
                        component.reuseMethod,
                        component.installCommand,
                        req.user.id
                    );


                const id =
                    result.lastInsertRowid;


                setKeywords(
                    id,
                    keywords
                );


                return id;

            })();


        res.status(201).json(
            hydrate([
                getOr404(id)
            ])[0]
        );

    })
);


app.put(
    "/api/components/:id",
    allow("cataloguer"),

    wrap((req, res) => {

        const existing =
            getOr404(
                req.params.id
            );

        const component =
            parseComponent(
                req.body
            );

        const keywords =
            parseKeywords(
                req.body?.keywords
            );

        const componentId =
            existing.id;

        db.transaction(() => {

            db.prepare(`
                UPDATE components
                SET
                    name=?,
                    description=?,
                    category_id=?,
                    type=?,
                    tech=?,
                    url=?,
                    artifact_format=?,
                    artifact_content=?,
                    usage_notes=?,
                    example_content=?,
                    delivery_method=?,
                    reuse_method=?,
                    install_command=?
                WHERE id=?
            `).run(
                component.name,
                component.description,
                component.categoryId,
                component.type,
                component.tech,
                component.url,
                component.artifactFormat,
                component.artifactContent,
                component.usageNotes,
                component.exampleContent,
                component.deliveryMethod,
                component.reuseMethod,
                component.installCommand,
                componentId
            );

            setKeywords(
                componentId,
                keywords
            );

        })();

        res.json(
            hydrate([
                getOr404(componentId)
            ])[0]
        );

    })
);


app.put(
    "/api/components/:id/keywords",
    allow("cataloguer"),

    wrap((req, res) => {

        getOr404(
            req.params.id
        );


        setKeywords(
            Number(
                req.params.id
            ),
            parseKeywords(
                req.body?.keywords
            )
        );


        res.json(
            hydrate([
                getOr404(
                    req.params.id
                )
            ])[0]
        );

    })
);


app.delete(
    "/api/components/:id",
    allow("cataloguer"),

    wrap((req, res) => {

        getOr404(
            req.params.id
        );


        db.prepare(`
            DELETE FROM components
            WHERE id=?
        `).run(
            Number(
                req.params.id
            )
        );


        res.status(204).end();

    })
);


/* =========================================================
   SEARCH + USAGE
   ========================================================= */

app.get(
    "/api/search",

    wrap((req, res) => {

        const query =
            String(
                req.query.q ?? ""
            ).trim();


        if (!query) {

            return res.json({

                query: "",

                count: 0,

                results: []

            });

        }


        const results =
            find({
                q: query,
                sort: req.query.sort
            });


        db.transaction(() => {

            const recentQuery = db.prepare(`
                SELECT id FROM query_log
                WHERE user_id = ? AND q = ? AND at >= datetime('now', '-5 seconds')
                ORDER BY id DESC LIMIT 1
            `).get(req.user.id, query.slice(0, 200));

            if (!recentQuery) {
                const update =
                    db.prepare(`
                        UPDATE components
                        SET queried_not_used_count =
                            queried_not_used_count + 1
                        WHERE id=?
                    `);

                results.forEach(
                    result =>
                        update.run(
                            result.id
                        )
                );

                db.prepare(`
                    INSERT INTO query_log(
                        user_id,
                        q,
                        result_count
                    )
                    VALUES(?,?,?)
                `).run(
                    req.user.id,
                    query.slice(0, 200),
                    results.length
                );
            }

        })();


        res.json({

            query,

            count:
                results.length,

            results

        });

    })
);


app.post(
    "/api/components/:id/use",

    wrap((req, res) => {

        getOr404(
            req.params.id
        );


        db.prepare(`
            UPDATE components

            SET
                used_count =
                    used_count + 1,

                queried_not_used_count =
                    MAX(
                        0,
                        queried_not_used_count - 1
                    )

            WHERE id=?
        `).run(
            Number(
                req.params.id
            )
        );


        res.json(
            hydrate([
                getOr404(
                    req.params.id
                )
            ])[0]
        );

    })
);


/* =========================================================
   STATISTICS
   ========================================================= */

app.get(
    "/api/stats",

    wrap((_req, res) => {

        const map =
            catMap();


        const totals =
            db.prepare(`
                SELECT

                    COUNT(*) AS components,

                    COALESCE(
                        SUM(used_count),
                        0
                    ) AS used,

                    COALESCE(
                        SUM(
                            queried_not_used_count
                        ),
                        0
                    ) AS notUsed

                FROM components
            `).get();


        const topCategories =
            [
                ...map.values()
            ]
                .filter(
                    category =>
                        !category.parent_id
                );


        res.json({

            ...totals,

            categories:
                topCategories.length,

            byCategory:
                topCategories.map(
                    category => ({

                        id:
                            category.id,

                        name:
                            category.name,

                        count:
                            db.prepare(`
                                SELECT COUNT(*) AS n
                                FROM components
                                WHERE category_id
                                    IN (
                                        ${subtree(
                                            map,
                                            category.id
                                        ).join()}
                                    )
                            `).get().n

                    })
                ),

            mostUsed:
                hydrate(
                    db.prepare(`
                        SELECT *
                        FROM components
                        ORDER BY
                            used_count DESC,
                            name
                        LIMIT 5
                    `).all()
                )

        });

    })
);


app.get(
    "/api/stats/purge-candidates",

    allow("cataloguer"),

    wrap((req, res) => {

        const threshold =
            Number(
                req.query.threshold ??
                15
            );


        if (
            !Number.isFinite(threshold) ||
            threshold < 1
        ) {

            throw bad(
                "threshold must be a positive number"
            );

        }


        res.json(
            hydrate(
                db.prepare(`
                    SELECT *
                    FROM components
                    WHERE used_count<?
                    ORDER BY
                        used_count,
                        name
                `).all(threshold)
            )
        );

    })
);


/* =========================================================
   ERRORS
   ========================================================= */

app.use(
    "/api",
    (_req, _res, next) =>
        next(
            bad(
                "Not found",
                404
            )
        )
);


app.use(
    (
        error,
        _req,
        res,
        _next
    ) => {

        if (!error.status) {
            console.error(error);
        }


        res.status(
            error.status || 500
        ).json({

            error:
                error.status
                    ? error.message
                    : "Internal server error"

        });

    }
);


/* =========================================================
   START SERVER
   ========================================================= */

if (
    require.main === module
) {

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(
            `ComponentHub API running on http://localhost:${port}`
        );
    });

}


module.exports = app;
