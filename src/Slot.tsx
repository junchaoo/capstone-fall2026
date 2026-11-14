interface SlotProps
{
  url: string | null;
  className?: string;
}

export default function Slot({ url, className = '' }: SlotProps)
{
  return url ? (
    <img src={url} alt="" className={`match-card__slot ${className}`} />
  ) : (
    <div className={`match-card__slot match-card__slot--empty ${className}`} />
  );
}