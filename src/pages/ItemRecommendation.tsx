import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './ChampionAnalysis.css';
import './ItemRecommendation.css';

type DataDragonItem = {
  name: string;
  description: string;
  plaintext: string;
  from?: string[];
  into?: string[];
  tags: string[];
  depth?: number;
  maps: Record<string, boolean>;
  gold: { base: number; total: number; sell: number; purchasable: boolean };
  image: { full: string };
};

type Item = DataDragonItem & { id: string };

const has = (item: DataDragonItem, ...tags: string[]) => tags.some((tag) => item.tags.includes(tag));

const LANES: { name: string; summary: string; match: (item: DataDragonItem) => boolean }[] = [
  {
    name: 'Top',
    summary: 'Durable fighters: damage with health, resistances and ability haste.',
    match: (i) => has(i, 'Damage') && has(i, 'Health', 'Armor', 'SpellBlock') && !has(i, 'CriticalStrike'),
  },
  {
    name: 'Jungle',
    summary: 'Jungle items for camp clearing and smite upgrades.',
    match: (i) => has(i, 'Jungle') || (has(i, 'Damage') && has(i, 'Health') && has(i, 'AbilityHaste')),
  },
  {
    name: 'Mid',
    summary: 'Ability power, penetration and mana for burst and poke.',
    match: (i) => has(i, 'SpellDamage') && has(i, 'Mana', 'MagicPenetration', 'AbilityHaste'),
  },
  {
    name: 'ADC',
    summary: 'Sustained physical damage: crit, attack speed and on-hit.',
    match: (i) => has(i, 'CriticalStrike', 'OnHit') || (has(i, 'Damage') && has(i, 'AttackSpeed')),
  },
  {
    name: 'Support',
    summary: 'Utility and team-oriented items: regen, haste, vision and actives.',
    match: (i) => has(i, 'ManaRegen', 'Vision') || (has(i, 'Active') && has(i, 'AbilityHaste', 'HealthRegen')),
  },
];

const CATEGORIES = [
  'All',
  'Damage',
  'SpellDamage',
  'AttackSpeed',
  'CriticalStrike',
  'Health',
  'Armor',
  'SpellBlock',
  'Mana',
  'AbilityHaste',
  'Boots',
];

const CATEGORY_LABELS: Record<string, string> = {
  SpellDamage: 'Ability Power',
  AttackSpeed: 'Attack Speed',
  CriticalStrike: 'Critical Strike',
  SpellBlock: 'Magic Resist',
  AbilityHaste: 'Ability Haste',
  ManaRegen: 'Mana Regen',
  HealthRegen: 'Health Regen',
  MagicPenetration: 'Magic Pen',
  LifeSteal: 'Life Steal',
  OnHit: 'On-Hit',
};

const label = (tag: string) => CATEGORY_LABELS[tag] ?? tag;

// Description is Data Dragon pseudo-HTML; keep line breaks, drop tags.
function toPlainText(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li>/gi, '\n• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function ItemRecommendation() {
  const [version, setVersion] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const versions: string[] = await (
          await fetch('https://ddragon.leagueoflegends.com/api/versions.json', {
            signal: controller.signal,
          })
        ).json();
        const response = await fetch(
          `https://ddragon.leagueoflegends.com/cdn/${versions[0]}/data/en_US/item.json`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error('Item request failed');
        const data: { data: Record<string, DataDragonItem> } = await response.json();

        // Some items exist twice under the same name (e.g. 3xxxxx variants); keep the lowest id.
        const byName = new Map<string, Item>();
        Object.entries(data.data)
          .map(([id, item]) => ({ id, ...item }))
          .filter((item) => item.maps['11'] && item.gold.purchasable && item.name)
          .sort((a, b) => Number(a.id) - Number(b.id))
          .forEach((item) => {
            if (!byName.has(item.name)) byName.set(item.name, item);
          });
        const summonersRift = [...byName.values()];

        setVersion(versions[0]);
        setItems(summonersRift);
      } catch (loadError) {
        if ((loadError as Error).name !== 'AbortError') {
          setError('Could not load item data from Data Dragon.');
        }
      }
    }

    load();
    return () => controller.abort();
  }, []);

  const itemsById = useMemo(
    () => Object.fromEntries(items.map((item) => [item.id, item])),
    [items],
  );

  const catalog = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items
      .filter((item) => item.gold.total > 0)
      .filter((item) => category === 'All' || item.tags.includes(category))
      .filter((item) => !term || item.name.toLowerCase().includes(term))
      .sort((a, b) => a.gold.total - b.gold.total || a.name.localeCompare(b.name));
  }, [items, category, search]);

  const laneItems = useMemo(
    () =>
      LANES.map((lane) => ({
        ...lane,
        items: items
          .filter((item) => !item.into?.length && item.gold.total >= 1600 && !has(item, 'Consumable', 'Trinket'))
          .filter(lane.match)
          .sort((a, b) => b.gold.total - a.gold.total || a.name.localeCompare(b.name)),
      })),
    [items],
  );

  const selected = itemsById[selectedId] ?? catalog[0];
  const iconUrl = (item: Item) =>
    `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${item.image.full}`;

  const renderItemButton = (item: Item) => (
    <button
      className={`item-tile ${selected?.id === item.id ? 'active' : ''}`}
      key={item.id}
      type='button'
      title={item.name}
      onClick={() => setSelectedId(item.id)}
    >
      <img src={iconUrl(item)} alt='' loading='lazy' />
      <span>{item.name}</span>
      <small>{item.gold.total}g</small>
    </button>
  );

  const renderRelated = (title: string, ids?: string[]) => {
    const related = (ids ?? []).map((id) => itemsById[id]).filter(Boolean);
    if (!related.length) return null;
    return (
      <div className='item-related'>
        <span className='rune-path-name'>{title}</span>
        <div className='item-tile-grid compact'>{related.map(renderItemButton)}</div>
      </div>
    );
  };

  return (
    <div className='champion-analysis-page'>
      <header className='champion-analysis-header'>
        <Link className='champion-analysis-brand' to='/' aria-label='LevelUp.gg home'>
          <span className='champion-analysis-brand-mark'>L</span>
          <span>
            LevelUp<span>.</span>gg
          </span>
        </Link>
        <nav className='champion-analysis-nav' aria-label='Item navigation'>
          <Link to='/champions'>Champions</Link>
          <Link className='selected' to='/items'>Items</Link>
          <Link to='/comparison'>Player Comparison</Link>
        </nav>
        <Link className='champion-analysis-back' to='/profile'>Profile</Link>
      </header>

      <main className='champion-analysis-main'>
        {error && <p className='champion-skins-message' role='alert'>{error}</p>}
        {!error && items.length === 0 && (
          <p className='champion-skins-message' role='status'>Loading items…</p>
        )}

        {items.length > 0 && (
          <div className='item-page-layout'>
            <div className='item-page-left'>
              <section className='analysis-panel'>
                <div className='panel-header'>
                  <div>
                    <span className='panel-eyebrow'>ITEM CATALOG</span>
                    <h2>All items</h2>
                  </div>
                  <span className='rune-role-label'>{catalog.length} items · Patch {version}</span>
                </div>
                <input
                  className='champion-search-input'
                  type='search'
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder='Search items'
                  aria-label='Search items'
                />
                <div className='item-role-tabs wrap'>
                  {CATEGORIES.map((name) => (
                    <button
                      key={name}
                      type='button'
                      className={category === name ? 'active' : ''}
                      onClick={() => setCategory(name)}
                    >
                      {label(name)}
                    </button>
                  ))}
                </div>
                <div className='item-tile-grid'>
                  {catalog.length > 0 ? catalog.map(renderItemButton) : (
                    <p className='champion-skins-message'>No matching items.</p>
                  )}
                </div>
              </section>

              <section className='analysis-panel'>
                <div className='panel-header'>
                  <div>
                    <span className='panel-eyebrow'>BY LANE</span>
                    <h2>Items by lane</h2>
                  </div>
                </div>
                {laneItems.map((lane) => (
                  <div className='item-lane' key={lane.name}>
                    <div className='item-lane-heading'>
                      <strong>{lane.name}</strong>
                      <span>{lane.summary}</span>
                    </div>
                    <div className='item-tile-grid compact'>{lane.items.map(renderItemButton)}</div>
                  </div>
                ))}
              </section>
            </div>

            {selected && (
              <aside className='analysis-panel item-detail-panel' aria-label='Item details'>
                <div className='item-detail-heading'>
                  <img src={iconUrl(selected)} alt='' />
                  <div>
                    <h2>{selected.name}</h2>
                    <strong className='item-gold'>{selected.gold.total} gold</strong>
                    <span> · sells for {selected.gold.sell}</span>
                  </div>
                </div>
                {selected.plaintext && <p className='item-plaintext'>{selected.plaintext}</p>}
                <p className='item-description'>{toPlainText(selected.description)}</p>
                <div className='item-tags'>
                  {selected.tags.map((tag) => <span key={tag}>{label(tag)}</span>)}
                </div>
                <p className='item-build-note'>
                  Combine cost {selected.gold.base}g · Total {selected.gold.total}g
                </p>
                {renderRelated('Builds from', selected.from)}
                {renderRelated('Builds into', selected.into)}
              </aside>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default ItemRecommendation;
