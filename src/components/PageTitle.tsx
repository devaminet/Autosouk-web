type PageTitleProps = {
  children: string;
};

// React moves this to <head>.
export function PageTitle({ children }: PageTitleProps) {
  return <title>{`${children} · AutoSouk`}</title>;
}
