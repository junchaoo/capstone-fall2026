export function timeAgo(timestamp: number): string
{
    const seconds = Math.floor((Date.now() - timestamp) / 1000); // Date.now returns in milliseconds
    const units: [string, number][] =                            // convert to seconds
    [
      ['day', 86400],
      ['hour', 3600],
      ['minute', 60],
    ];

    for (const [name, size] of units)
    {
      const value = Math.floor(seconds / size);
      if (value >= 1) return `${value} ${name}${value > 1 ? 's' : ''} ago`;
    }
    return 'Just now';
}