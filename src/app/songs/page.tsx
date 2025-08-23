import I18nSwitcher from "../I18nSwitcher";

export default function SongsPage() {
  return (
    <div className="min-h-screen p-8">
      <header className="flex justify-end mb-8">
        <I18nSwitcher />
      </header>
      <main>
        <h1>Songs</h1>
      </main>
    </div>
  );
}
