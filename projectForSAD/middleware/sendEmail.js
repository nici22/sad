const nodemailer = require('nodemailer');

module.exports = async (email, fullname, subject, text) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            service: process.env.EMAIL_SERVICE,
            port: Number(process.env.EMAIL_PORT),
            secure: Boolean(process.env.EMAIL_SECURE),
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            }
        });

        await transporter.sendMail({
            from: `Socialize <${process.env.EMAIL_USER}>`,
            to: email,
            subject,
            text: `
            Hi ${fullname},

            Thanks for getting started with Socialize website!
            We need a little more information to complete your registration, including a confirmation of your email address.
            Click below to confirm your email address:

            ${text}

            If you have problems on clicking the link, please paste the above URL into your web browser.

            Best regards, Socialize team lead (Huseyn Aghazada)`,
        });
        console.log('email sent successfully');
    }
    catch (err) {
        console.log('email not sent');
        console.error(err);
    }
};;