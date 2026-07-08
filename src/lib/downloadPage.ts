// Client-side behaviour for the download page (download.astro).
// Kept in a .ts module so it goes through Vite's TypeScript pipeline rather
// than the inline .astro client-script transform (see lib/home.ts for why).
import { fetchLatestRelease, RELEASES_URL } from "./releases";

export async function initDownloadPage() {
  const versionLabel = document.getElementById("version-label");
  const cards = document.querySelectorAll<HTMLAnchorElement>(".download-card");

  try {
    const release = await fetchLatestRelease();

    if (versionLabel && release.tag_name) {
      versionLabel.textContent = `Latest (${release.tag_name})`;
    }

    const changelogLink = document.getElementById("changelog-link") as HTMLAnchorElement | null;
    if (changelogLink && release.html_url) {
      changelogLink.href = release.html_url;
      changelogLink.style.display = "";
    }

    cards.forEach((card) => {
      const suffix = card.dataset.asset;
      if (!suffix) return;

      const match = (release.assets ?? []).find((a) => a.name.endsWith(`-${suffix}`));
      if (match) {
        card.href = match.browser_download_url;
      } else {
        card.href = RELEASES_URL;
      }
    });
  } catch {
    if (versionLabel) {
      versionLabel.textContent = "Could not load release info.";
    }
    cards.forEach((card) => {
      card.href = RELEASES_URL;
    });
  }
}
