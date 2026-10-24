import React from 'react';
// Routing is outside this isolated component test; preserve the rendered link and label.
export default function QaLink({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a href={href} {...props}>{children}</a>;
}
