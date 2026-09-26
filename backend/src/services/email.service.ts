// import { Resend } from "resend";
import { env } from "../config/configs";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
    },
});

export async function sendVerificationEmail(email: string, otp: string) {
    console.log("Sending verification email to:", email);

    await transporter.sendMail({
        from: env.EMAIL_FROM,
        to: email,
        subject: "Verify your AniAsk account",
        html: `
            <h2>Verify your email</h2>

            <p>Your AniAsk verification code is:</p>

            <h1>${otp}</h1>

            <p>This code will expire in 10 minutes.</p>

            <p>
                If you did not create this account,
                you can safely ignore this email.
            </p>
        `,
    });
}

// const resend = new Resend(env.RESEND_API_KEY);

// export async function sendVerificationEmail(email: string, otp: string) {
//     console.log("Sending verification email to:", email);
//     const { error } = await resend.emails.send({
//         from: env.EMAIL_FROM,
//         to: email,
//         subject: "Verify your AniAsk account",
//         html: `
//             <h2>Verify your email</h2>

//             <p>
//                 Your AniAsk verification code is:
//             </p>

//             <h1>${otp}</h1>

//             <p>
//                 This code will expire in 10 minutes.
//             </p>

//             <p>
//                 If you did not create this account,
//                 you can safely ignore this email.
//             </p>
//         `,
//     });
//     if (error) {
//         throw new Error(`Failed to send verification email: ${error.message}`);
//     }
// }
// export async function sendVerificationEmail(email: string, otp: string) {
//     console.log(`Verification OTP for ${email}: ${otp}`);
// }
