/* =========================================================
   One-time user password migration utility.

   Reads passwords from environment variables and stores
   only scrypt hashes in SQLite.

   Required:
     SEED_STUDENT_PASSWORD
     SEED_CATALOGUER_PASSWORD
     SEED_MANAGER_PASSWORD
   ========================================================= */

require("dotenv").config();

const {
    db,
    hashPassword
} = require("../src/db");


const REQUIRED = [
    "SEED_STUDENT_PASSWORD",
    "SEED_CATALOGUER_PASSWORD",
    "SEED_MANAGER_PASSWORD"
];


for (const variable of REQUIRED) {

    if (
        !process.env[variable] ||
        process.env[variable].trim().length < 8
    ) {

        console.error(
            `${variable} must be set and contain at least 8 characters.`
        );

        process.exit(1);
    }
}


const passwords = {
    student:
        process.env.SEED_STUDENT_PASSWORD,

    cataloguer:
        process.env.SEED_CATALOGUER_PASSWORD,

    manager:
        process.env.SEED_MANAGER_PASSWORD
};


const updateUser =
    db.prepare(`
        UPDATE users
        SET password_hash = ?
        WHERE username = ?
    `);


const findUser =
    db.prepare(`
        SELECT username, role
        FROM users
        WHERE username = ?
    `);


try {

    const migrate =
        db.transaction(() => {

            for (
                const [username, password]
                of Object.entries(passwords)
            ) {

                const user =
                    findUser.get(username);


                if (!user) {

                    throw new Error(
                        `User '${username}' does not exist.`
                    );
                }


                updateUser.run(
                    hashPassword(password),
                    username
                );

            }

        });


    migrate();


    console.log(
        "User passwords updated successfully."
    );

    console.log(
        "Updated accounts: student, cataloguer, manager"
    );

}

catch (error) {

    console.error(
        "Password migration failed:",
        error.message
    );

    process.exitCode = 1;

}

finally {

    db.close();

}
