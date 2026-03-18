<script>
	/**
	 * SVG Spider/Radar chart for up to 8 skill attributes.
	 * @prop {Record<string, number>} stats  - e.g. { potencia: 80, resistencia: 30, tecnica: 90, apnea: 50 }
	 * @prop {number} size                   - square size in px (default 180)
	 * @prop {string} fillColor              - polygon fill (default purple with alpha)
	 * @prop {string} strokeColor            - polygon stroke (default purple)
	 */
	export let stats = {};
	export let size = 180;
	export let fillColor = 'rgba(168, 85, 247, 0.30)';
	export let strokeColor = '#a855f7';
	/** 'dark' (default, for dark/gradient backgrounds) | 'light' (for white/light backgrounds) */
	export let theme = 'dark';

	$: gridStroke = theme === 'light' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)';
	$: axisStroke = theme === 'light' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)';
	$: labelFill = theme === 'light' ? '#0c4a6e' : 'rgba(255,255,255,0.8)';
	$: centerDot = theme === 'light' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.3)';

	const LABEL_MAP = {
		potencia: 'Potencia',
		resistencia: 'Resistencia',
		tecnica: 'Técnica',
		apnea: 'Apnea',
		velocidad: 'Velocidad',
		fondo: 'Fondo',
		tecnica_aletas: 'Aletas',
		coordinacion: 'Coord.'
	};

	$: entries = Object.entries(stats).filter(([, v]) => typeof v === 'number');
	$: n = entries.length;
	$: cx = size / 2;
	$: cy = size / 2;
	$: r = size * 0.34; // max-value radius

	const PLACEHOLDER_KEYS = ['potencia', 'resistencia', 'tecnica', 'apnea', 'fondo'];
	$: isEmpty = n < 3;
	// When empty, show 5 placeholder axes all at value 0 (ghost state)
	$: displayEntries = isEmpty ? PLACEHOLDER_KEYS.map(k => [k, 0]) : entries;
	$: displayN = displayEntries.length;

	function angle(i, total) {
		return (2 * Math.PI * i) / total - Math.PI / 2;
	}

	function axisPoint(i, total, scale = 1) {
		const a = angle(i, total);
		return {
			x: cx + r * scale * Math.cos(a),
			y: cy + r * scale * Math.sin(a)
		};
	}

	function dataPoint(i, value, total) {
		const a = angle(i, total);
		const radius = r * Math.max(0, Math.min(100, value)) / 100;
		return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
	}

	/** Determine SVG text-anchor based on angular position */
	function textAnchor(i, total) {
		const a = ((angle(i, total) + 2 * Math.PI) % (2 * Math.PI));
		if (a < Math.PI / 6 || a > (11 * Math.PI) / 6) return 'middle'; // top
		if (a < (5 * Math.PI) / 6) return 'start'; // right side
		if (a < (7 * Math.PI) / 6) return 'middle'; // bottom
		return 'end'; // left side
	}

	$: dataPoints = displayEntries.map(([, v], i) => dataPoint(i, v, displayN));
	$: dataPolygon = dataPoints.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
	$: gridRings = [0.25, 0.5, 0.75, 1.0];
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 {size} {size}"
	class="overflow-visible select-none"
	aria-label="Radar de habilidades"
	style="opacity: {isEmpty ? 0.45 : 1}; transition: opacity 0.3s;"
>
	<!-- Grid rings -->
	{#each gridRings as scale}
		{@const pts = Array.from({ length: displayN }, (_, i) => axisPoint(i, displayN, scale))}
		<polygon
			points={pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')}
			fill="none"
			stroke={gridStroke}
			stroke-width="0.75"
		/>
	{/each}

	<!-- Axes -->
	{#each displayEntries as _, i}
		{@const ap = axisPoint(i, displayN)}
		<line
			x1={cx}
			y1={cy}
			x2={ap.x.toFixed(2)}
			y2={ap.y.toFixed(2)}
			stroke={axisStroke}
			stroke-width="0.75"
		/>
	{/each}

	<!-- Data polygon fill -->
	{#if isEmpty}
		<!-- Ghost ring at 25% when no data -->
		{@const ghostPts = Array.from({ length: displayN }, (_, i) => axisPoint(i, displayN, 0.25))}
		<polygon
			points={ghostPts.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')}
			fill={fillColor}
			stroke={strokeColor}
			stroke-width="1"
			stroke-dasharray="3 2"
			stroke-linejoin="round"
		/>
		<!-- Lock icon centered -->
		<text x={cx} y={cy} text-anchor="middle" dominant-baseline="middle" font-size="14" opacity="0.5">🔓</text>
	{:else}
		<polygon points={dataPolygon} fill={fillColor} stroke={strokeColor} stroke-width="1.5" stroke-linejoin="round" />
		<!-- Data point dots -->
		{#each dataPoints as p}
			<circle cx={p.x.toFixed(2)} cy={p.y.toFixed(2)} r="3" fill={strokeColor} />
		{/each}
	{/if}

	<!-- Labels -->
	{#each displayEntries as [key, value], i}
		{@const lp = axisPoint(i, displayN, 1.38)}
		{@const anchor = textAnchor(i, displayN)}
		{@const label = LABEL_MAP[key] ?? key}
		<text
			x={lp.x.toFixed(2)}
			y={lp.y.toFixed(2)}
			text-anchor={anchor}
			dominant-baseline="middle"
			font-size="8"
			font-weight="600"
			fill={labelFill}
		>{label}</text>
		{#if !isEmpty}
			<text
				x={lp.x.toFixed(2)}
				y={(lp.y + 9).toFixed(2)}
				text-anchor={anchor}
				dominant-baseline="middle"
				font-size="7"
				fill={strokeColor}
				font-weight="700"
			>{value}</text>
		{/if}
	{/each}

	<!-- Center dot -->
	<circle cx={cx} cy={cy} r="2" fill={centerDot} />
</svg>
