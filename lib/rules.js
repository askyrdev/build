export default function( globalFiles ) {
	return [
		/**
		 * Handle JSON files as an asset rather than attempting to transpile into JS.
		 *
		 * This is needed to support the `{ "$schema": "https://schemas.wp.org/trunk/theme.json" }` common in WordPress.
		 *
		 * @ai-assist {Proton Lumo|Max 2.0} explanation and suggestion for this addition.
		 */
		{
			test: /\.json$/,
			type: 'json',
		},
		/**
		 * Treat image files as assets. This also helps with third-party libraries, such as Leaflet.js, which have CSS
		 * with image assets that need to be cloned into the output directory.
		 */
		{
			test: /\.(png|jpe?g|gif|svg)$/i,
			type: 'asset/resource',
			generator: {
				filename: 'images/[name][ext]',
			},
		},
		/**
		 * JavaScript transpiling.
		 */
		{
			test: /\.js$/, // If changed, ensure it is suffixed with `$` to prevent `.json` being mistaken for `.js`.
			exclude: /node_modules/,
			loader: 'builtin:swc-loader',
			options: {
				env: {
					targets: "> 0.25%, not dead",
				},
				jsc: {
					parser: {
						syntax: 'ecmascript',
						jsx: true,
					},
				},
			},
			type: 'javascript/auto',
		},
		/**
		 * CSS/PostCSS.
		 */
		{
			test: /\.css$/,
			use: [
				{
					loader: 'postcss-loader',
					options: {
						postcssOptions: {
							plugins: {
								'postcss-import': {},
								'@csstools/postcss-global-data': {
									files: [ ...globalFiles ],
								},
								'postcss-mixins': {},
								'postcss-preset-env': {
									browsers: 'last 2 versions',
									features: {
										'nesting-rules': true,
									},
								},
								'postcss-url': {
									url: 'rebase',
								},
							},
						},
					},
				},
			],
			type: 'css/auto',
		},
	];
};
