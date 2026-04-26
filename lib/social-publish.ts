import { logIntegrationEvent } from "./integration-logger";
import { sendEventNotification } from "./notifications";

export async function publishToPlatform({
  post,
  account,
}: {
  post: any;
  account: any;
}): Promise<{ success: boolean; error?: string }> {
  const hasRealCredentials =
    account.platform === "instagram" || account.platform === "facebook"
      ? process.env.META_APP_ID
      : process.env.LINKEDIN_CLIENT_ID;

  if (!hasRealCredentials) {
    await logIntegrationEvent({
      userId: post.userId,
      event: "post_published",
      platform: account.platform,
      status: "info",
      message: `Post publicado em modo simulado no ${account.platform}`,
      metadata: { postId: post.id, simulated: true },
    });
    return { success: true };
  }

  try {
    if (account.platform === "instagram") {
      if (post.image) {
        const mediaRes = await fetch(
          `https://graph.facebook.com/v18.0/${account.accountId}/media`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image_url: post.image,
              caption: `${post.title}\n\n${post.content}\n\n${JSON.parse(post.hashtags).join(" ")}`,
              access_token: account.accessToken,
            }),
          }
        );
        const mediaData = await mediaRes.json();
        if (!mediaRes.ok) throw new Error(mediaData.error?.message || "Instagram media creation failed");

        const publishRes = await fetch(
          `https://graph.facebook.com/v18.0/${account.accountId}/media_publish`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              creation_id: mediaData.id,
              access_token: account.accessToken,
            }),
          }
        );
        if (!publishRes.ok) {
          const err = await publishRes.json();
          throw new Error(err.error?.message || "Instagram publish failed");
        }
      }
    }

    if (account.platform === "facebook") {
      const url = post.image
        ? `https://graph.facebook.com/v18.0/${account.accountId}/photos`
        : `https://graph.facebook.com/v18.0/${account.accountId}/feed`;
      const body: any = { access_token: account.accessToken };
      if (post.image) {
        body.url = post.image;
        body.caption = `${post.title}\n\n${post.content}`;
      } else {
        body.message = `${post.title}\n\n${post.content}\n\n${JSON.parse(post.hashtags).join(" ")}`;
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Facebook publish failed");
      }
    }

    if (account.platform === "linkedin") {
      const author = account.accountId.startsWith("urn:")
        ? account.accountId
        : `urn:li:person:${account.accountId}`;

      const body = {
        author,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: {
              text: `${post.title}\n\n${post.content}\n\n${JSON.parse(post.hashtags).join(" ")}`,
            },
            shareMediaCategory: post.image ? "IMAGE" : "NONE",
            media: post.image
              ? [{ status: "READY", originalUrl: post.image }]
              : [],
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      };

      const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${account.accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "LinkedIn publish failed");
      }
    }

    await logIntegrationEvent({
      userId: post.userId,
      event: "post_published",
      platform: account.platform,
      status: "success",
      message: `Post publicado com sucesso no ${account.platform}`,
      metadata: { postId: post.id, accountId: account.id },
    });

    await sendEventNotification({
      userId: post.userId,
      eventType: "post_published",
      message: `Seu post "${post.title}" foi publicado com sucesso no ${account.platform}.`,
    });

    return { success: true };
  } catch (error: any) {
    await logIntegrationEvent({
      userId: post.userId,
      event: "post_failed",
      platform: account.platform,
      status: "error",
      message: error.message || `Falha ao publicar no ${account.platform}`,
      metadata: { postId: post.id, accountId: account.id },
    });

    await sendEventNotification({
      userId: post.userId,
      eventType: "post_failed",
      message: `Falha ao publicar "${post.title}" no ${account.platform}: ${error.message || "Erro desconhecido"}. Acesse /integrations para tentar novamente.`,
    });

    return { success: false, error: error.message };
  }
}
