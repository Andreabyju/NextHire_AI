const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendPasswordResetEmail = async (email, resetUrl) => {
    const mailOptions = {
        from: `"NextHire AI" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "NextHire AI - Password Reset",
        html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: auto;
        padding: 30px;
        background: #050816;
        color: white;
        border-radius: 12px;
      ">
        <h1 style="color: #7c3aed;">
          NextHire AI
        </h1>

        <h2>Password Reset Request</h2>

        <p>
          We received a request to reset your NextHire AI password.
        </p>

        <p>
          Click the button below to create a new password:
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a
            href="${resetUrl}"
            style="
              display: inline-block;
              padding: 14px 25px;
              background: linear-gradient(90deg, #2563eb, #7c3aed);
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
            "
          >
            Reset My Password
          </a>
        </div>

        <p>
          This link will expire in <strong>15 minutes</strong>.
        </p>

        <p style="color: #94a3b8;">
          If you did not request a password reset, you can safely ignore
          this email.
        </p>

        <hr style="border-color: #334155;">

        <p style="color: #64748b; font-size: 12px;">
          © ${new Date().getFullYear()} NextHire AI
        </p>
      </div>
    `,
    };

    await transporter.sendMail(mailOptions);
};

module.exports = {
    sendPasswordResetEmail,
};   