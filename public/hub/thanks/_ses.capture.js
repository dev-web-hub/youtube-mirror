export async function sendSES(email) {
  if (!email || !process.env.AWS_ACCESS_KEY_ID) return;
  try {
    const AWS = await import("aws-sdk");
    const ses = new AWS.SES({ region: process.env.AWS_DEFAULT_REGION });
    await ses.sendEmail({
      Source: process.env.BUSINESS_EMAIL,
      Destination: { ToAddresses: [process.env.BUSINESS_EMAIL] },
      Message: {
        Subject: { Data: "Cubecast Hub Signup" },
        Body: { Text: { Data: "New email: " + email } }
      }
    }).promise();
  } catch(_) {
    /* silent */
  }
}
