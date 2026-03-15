import Image from "next/image";
import Link from "next/link";

type LogoSize = "medium" | "small";

interface LogoProps {
  size?: LogoSize;
  href?: string;
}

const sizeConfig: Record<
  LogoSize,
  { imgSize: number; fontSize: string; src: string }
> = {
  medium: {
    imgSize: 40,
    fontSize: "40px",
    src: "/logo.png",
  },
  small: {
    imgSize: 25,
    fontSize: "25px",
    src: "/logo.png",
  },
};

const Logo = ({ size = "medium", href = "/" }: LogoProps) => {
  const { imgSize, fontSize, src } = sizeConfig[size];

  return (
    <Link
      href={href}
      className="flex flex-row items-center"
      style={{ gap: "10px" }}
    >
      <Image src={src} alt="EcoLink Logo" width={imgSize} height={imgSize} />
      <span
        style={{
          fontFamily: "var(--font-logo)",
          fontSize,
          lineHeight: 1,
        }}
      >
        EcoLink
      </span>
    </Link>
  );
};

export default Logo;
