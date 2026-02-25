// src/components/Button.tsx

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
};

export function Button({ children, onClick }: ButtonProps) {
  const classes =
    "inline-flex items-center rounded-md px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <button type="button" onClick={onClick} className={classes}>
      {children}
    </button>
  );
}