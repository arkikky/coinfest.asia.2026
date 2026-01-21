import React from 'react';

interface ContainerProps {
  className?: string | null;
  children: React.ReactNode;
}

const Container: React.FC<ContainerProps> = ({ className = null, children }) => {
  const defaultCls = `container`;
  const cls = className ? `${defaultCls} ${className}` : `${defaultCls}`;

  return (
    <>
      <div className={`${cls}`}>{children}</div>
    </>
  );
};

export default Container;