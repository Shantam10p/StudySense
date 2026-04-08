import senseiLogo from "../assets/sensei_face.png";

interface LoaderProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export function Loader({ message = "Loading...", size = "md" }: LoaderProps) {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-32 h-32",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`${sizeClasses[size]} animate-spin`}>
        <img src={senseiLogo} alt="Loading" className="w-full h-full" />
      </div>
      {message && (
        <p className="text-sm text-[#acabaa] font-medium">{message}</p>
      )}
    </div>
  );
}
