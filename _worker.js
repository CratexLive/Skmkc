export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get("url");

    if (!targetUrl) {
      return env.ASSETS ? env.ASSETS.fetch(request) : new Response("Missing target URL", { status: 400 });
    }

    try {
      const modifiedHeaders = new Headers(request.headers);
      modifiedHeaders.set("Referer", "https://twitcasting.tv/");
      modifiedHeaders.set("Origin", "https://twitcasting.tv/");
      modifiedHeaders.delete("Host");

      const response = await fetch(targetUrl, {
        method: request.method,
        headers: modifiedHeaders,
        body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
        redirect: "follow"
      });

      const newResponse = new Response(response.body, response);
      
      newResponse.headers.delete("X-Frame-Options");
      newResponse.headers.delete("Content-Security-Policy");
      newResponse.headers.set("Access-Control-Allow-Origin", "*");

      return newResponse;
    } catch (e) {
      return new Response("Proxy error: " + e.message, { status: 500 });
    }
  }
};
