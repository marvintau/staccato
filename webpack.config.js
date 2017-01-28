
module.exports = {
    entry: "./view/Staccato.js",
    output: {
        filename: 'staccato-bundle.js',
        publicPath: 'http://localhost:8090/assets'
    },
    module: {
        loaders: [
            {
              test: /\.js$/,
              exclude: /(node_modules|bower_components)/,
              loader: 'babel-loader',
              query: {
                presets: ['es2015']
              }
            },
            {
              test: /\.pegjs$/,
              loader: 'pegjs-loader'
            },
            { test: /\.css$/, loader: "style!css" },
            { test: /\.(png|jpg)$/, loader: 'url-loader' },
            {
                test: /\.txt$/,
                loader: 'raw-loader'
            }
        ]
    },
    resolve: {
        extensions: ['', '.js', '.jsx']
    }
}
