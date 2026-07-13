import { House } from "@phosphor-icons/react/dist/ssr";
import { Link } from "@/components/ui/Link";
import { cn } from "@/lib/cn";
import styles from "@/components/ui/breadcrumb.module.css";

export type BreadcrumbItem = {
  label: string;
  href?: string;
  home?: boolean;
};

export type BreadcrumbProps = {
  items: BreadcrumbItem[];
  className?: string;
  separator?: string;
  homeLabel?: string;
};

function HomeIcon() {
  return <House className={styles.homeIcon} aria-hidden="true" />;
}

export function Breadcrumb({
  items,
  className,
  separator = "/",
  homeLabel = "Home",
}: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn(styles.root, className)}>
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className={styles.item}>
              {index > 0 ? (
                <span className={styles.separator} aria-hidden="true">
                  {separator}
                </span>
              ) : null}
              {isLast ? (
                item.home ? (
                  <span className={cn(styles.current, styles.homeCrumb)} aria-current="page">
                    <HomeIcon />
                    {item.label || homeLabel}
                  </span>
                ) : (
                  <span className={styles.current} aria-current="page">
                    {item.label}
                  </span>
                )
              ) : item.href ? (
                item.home ? (
                  <Link
                    href={item.href}
                    variant="subtle"
                    size="sm"
                    className={styles.link}
                    leadingIcon={<HomeIcon />}
                  >
                    {item.label ? item.label : <span className="sr-only">{homeLabel}</span>}
                  </Link>
                ) : (
                  <Link href={item.href} variant="subtle" size="sm" className={styles.link}>
                    {item.label}
                  </Link>
                )
              ) : item.home ? (
                <span className={cn(styles.current, styles.homeCrumb)}>
                  <HomeIcon />
                  {item.label || homeLabel}
                </span>
              ) : (
                <span className={styles.current}>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
