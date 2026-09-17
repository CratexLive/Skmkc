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

      const contentType = response.headers.get("content-type") || "";
      
      // Handle HLS playlists (.m3u8) and segments (.ts / .mp4) for streaming playback
      if (contentType.includes("application/vnd.apple.mpegurl") || contentType.includes("text/plain") || targetUrl.includes(".m3u8") || targetUrl.includes("ts")) {
        let text = await response.text();
        const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1);
        const lines = text.split("\n");
        const rewrittenLines = lines.map(line => {
          line = line.trim();
          if (line && !line.startsWith("#")) {
            let absoluteSegmentUrl = line.startsWith("http") ? line : new URL(line, baseUrl).toString();
            return `${url.origin}/?url=${encodeURIComponent(absoluteSegmentUrl)}`;
          }
          return line;
        });

        const newResponse = new Response(rewrittenLines.join("\n"), response);
        newResponse.headers.set("Access-Control-Allow-Origin", "*");
        return newResponse;
      }

      const newResponse = new Response(response.body, response);
      newResponse.headers.set("Access-Control-Allow-Origin", "*");
      return newResponse;
    } catch (e) {
      return new Response("Proxy error: " + e.message, { status: 500 });
    }
  }
};
