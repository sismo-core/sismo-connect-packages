import React from "react";

type ButtonProps = {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: (e?: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  loading?: boolean;
  disabled?: boolean;
};

export const PwsButton = ({
  children,
  style,
  onClick,
  loading,
}: ButtonProps) => {

  return (
    <button
      style={style}
      onClick={(e) => !loading && onClick && onClick()}
    >
      <div>
        {children}
      </div>
    </button>
  );
}
