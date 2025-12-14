import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

interface ActionCardBaseProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

interface ActionCardLinkProps extends ActionCardBaseProps {
  href: string;
  onClick?: never;
}

interface ActionCardButtonProps extends ActionCardBaseProps {
  onClick: () => void;
  href?: never;
}

type ActionCardProps = ActionCardLinkProps | ActionCardButtonProps;

export function ActionCard({
  title,
  description,
  icon: Icon,
  href,
  onClick,
}: ActionCardProps) {
  const content = (
    <Card className="hover:bg-muted/50 h-full transition-colors">
      <CardHeader>
        <div className="bg-primary/10 text-primary mb-3 flex size-12 items-center justify-center rounded-lg">
          <Icon className="size-6" />
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      {content}
    </button>
  );
}
