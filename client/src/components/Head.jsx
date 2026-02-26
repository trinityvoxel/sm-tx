import { Helmet } from 'react-helmet-async';

export default function Head({
  title = 'SM-TX | San Marcos Events',
  description = 'Everything happening in San Marcos, TX — Music, Food, Festivals, Markets and more. Your local events hub.',
  image = 'https://sm-tx.com/og-default.jpg',
  url = 'https://sm-tx.com',
  type = 'website',
  schema = null
}) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* JSON-LD Schema */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
}
