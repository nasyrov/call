import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

interface ActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
}

export function ActionCard({
  title,
  description,
  icon: Icon,
  href,
}: ActionCardProps) {
  return (
    <Link href={href}>
      <Card className="hover:bg-muted/50 h-full transition-colors">
        <CardHeader>
          <div className="bg-primary/10 text-primary mb-3 flex size-12 items-center justify-center rounded-lg">
            <Icon className="size-6" />
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
