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

const {
    db,
    hashPassword,
    verifyPassword
} = require("./db");


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


app.use(
    cors({
        origin:
            process.env.CORS_ORIGIN ||
            true
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

const hashSignupValue = value =>
    crypto
        .createHmac("sha256", SECRET)
        .update(value)
        .digest("hex");

const newOtp = () =>
    String(crypto.randomInt(100000, 1000000));

const newSignupToken = () =>
    crypto.randomBytes(32).toString("hex");

const rateLimited = (key, interval) => {
    const now = Date.now();
    const previous = signupRate.get(key) || 0;
    if (now - previous < interval) return true;
    signupRate.set(key, now);
    return false;
};

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
                            created_by
                        )
                        VALUES(?,?,?,?,?,?,?)
                    `).run(
                        component.name,
                        component.description,
                        component.categoryId,
                        component.type,
                        component.tech,
                        component.url,
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
                    url=?
                WHERE id=?
            `).run(
                component.name,
                component.description,
                component.categoryId,
                component.type,
                component.tech,
                component.url,
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
