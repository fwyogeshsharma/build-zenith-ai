import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  projectName: string;
  inviterName: string;
  role: string;
  token: string;
  acceptUrl: string;
  declineUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, projectName, inviterName, role, token, acceptUrl, declineUrl }: InvitationRequest = await req.json();
    const declineLink = declineUrl || `${acceptUrl}&action=decline`;

    console.log("Sending invitation email to:", email);
    console.log("Project:", projectName);
    console.log("Inviter:", inviterName);
    console.log("Accept URL:", acceptUrl);

    // Use a more reliable from address
    const fromAddress = Deno.env.get("FROM_EMAIL") || "FutureBuild <onboarding@resend.dev>";
    
    const emailResponse = await resend.emails.send({
      from: fromAddress,
      to: [email],
      subject: `Project invitation: ${projectName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Project Invitation</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">FutureBuild</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 5px 0; font-size: 16px;">Project Management Platform</p>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">You're Invited!</h2>
              
              <p style="color: #4b5563; line-height: 1.6; font-size: 16px; margin-bottom: 25px;">
                <strong>${inviterName}</strong> has invited you to join the project <strong>"${projectName}"</strong> as a <strong>${role.replace('_', ' ')}</strong>.
              </p>
              
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2563eb;">
                <p style="margin: 0; color: #374151; font-size: 14px;">
                  <strong>Project:</strong> ${projectName}<br>
                  <strong>Role:</strong> ${role.replace('_', ' ')}<br>
                  <strong>Invited by:</strong> ${inviterName}
                </p>
              </div>
              
              <!-- Action Buttons -->
              <div style="text-align: center; margin: 35px 0;">
                <table style="margin: 0 auto;">
                  <tr>
                    <td style="padding: 0 10px;">
                      <a href="${acceptUrl}" 
                         style="background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; border: none;">
                        Accept Invitation
                      </a>
                    </td>
                    <td style="padding: 0 10px;">
                      <a href="${declineLink}" 
                         style="background: #6b7280; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; border: none;">
                        Decline
                      </a>
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- Alternative Link -->
              <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin: 25px 0;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0; font-weight: 500;">
                  Can't see the buttons? Copy and paste this link:
                </p>
                <p style="margin: 0;">
                  <a href="${acceptUrl}" style="color: #2563eb; word-break: break-all; font-size: 14px;">${acceptUrl}</a>
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">
                This invitation expires in 7 days.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      // Add text version for better deliverability
      text: `
You're invited to join ${projectName}!

${inviterName} has invited you to join the project "${projectName}" as a ${role.replace('_', ' ')}.

To accept this invitation, visit: ${acceptUrl}

To decline this invitation, visit: ${declineLink}

This invitation expires in 7 days.

If you didn't expect this invitation, you can safely ignore this email.

---
FutureBuild Project Management Platform
      `.trim()
    });

    console.log("Invitation email sent successfully:", emailResponse);
    
    if (emailResponse.error) {
      console.error("Email send error details:", emailResponse.error);
      throw new Error(`Email send failed: ${emailResponse.error.message}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id,
      details: {
        to: email,
        subject: `You're invited to join ${projectName} on FutureBuild`,
        emailId: emailResponse.data?.id
      }
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending invitation email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);