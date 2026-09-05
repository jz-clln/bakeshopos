// File: app/src/components/layout/NavBar.tsx
//
// An iOS-style large title bar: the title starts big and left-aligned,
// like the native Settings/Mail apps, rather than a centered small
// title in a colored bar.

interface NavBarProps {
  title: string;
}

export function NavBar({ title }: NavBarProps) {
  return (
    <header
      className="sticky top-0 z-10 bg-[#FAFAF8]/90 backdrop-blur-md px-4 pb-2"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}
    >
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
        {title}
      </h1>
    </header>
  );
}