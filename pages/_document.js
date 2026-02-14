import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
    return (
        <Html lang="en">
            <Head />
            <body className="antialiased min-h-screen bg-slate-950 text-slate-50">
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
