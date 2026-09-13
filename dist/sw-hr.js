self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "notify" && data.title) {
    self.registration.showNotification(data.title, {
      body: data.body || "",
      icon: "/vite.svg",
      badge: "/vite.svg",
      data: { url: "/employee-portal" },
    });
  }
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("/employee-portal");
      return undefined;
    })
  );
});
