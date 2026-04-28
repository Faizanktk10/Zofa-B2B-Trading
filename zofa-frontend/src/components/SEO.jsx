import { Helmet } from 'react-helmet-async';

export default function SEO({ title, description, keywords, url }) {
  const fullTitle = title ? `${title} | Zofa B2B Trading` : 'Zofa B2B Trading — Pakistan\'s #1 B2B Marketplace';
  const desc = description || 'Connect with verified buyers and suppliers for scrap, textile, agriculture, machinery, packaging and raw materials across Pakistan.';
  const kw = keywords || 'B2B Pakistan, RFQ marketplace, scrap buyers, textile suppliers, industrial goods Pakistan, Zofa B2B';

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta name="keywords" content={kw} />
      <meta name="robots" content="index, follow" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url || 'https://zofa.pk'} />
      <meta property="og:site_name" content="Zofa B2B Trading" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <link rel="canonical" href={url || 'https://zofa.pk'} />
    </Helmet>
  );
}
