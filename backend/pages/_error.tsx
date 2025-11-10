import { NextPageContext } from 'next';
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

interface ErrorProps {
  statusCode?: number;
  hasGetInitialPropsRun?: boolean;
  err?: Error;
}

function Error({ statusCode, hasGetInitialPropsRun, err }: ErrorProps) {
  if (!hasGetInitialPropsRun && err) {
    // getInitialProps is not called in case of
    // https://github.com/vercel/next.js/issues/8592
  }

  return (
    <>
      <Head>
        <title>Error - Portify | Portfolio Intelligence</title>
      </Head>
      <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'monospace', background: '#1A1A1A', color: '#00FF80', minHeight: '100vh' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>
          {statusCode ? `Error ${statusCode}` : 'An Error Occurred'}
        </h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '40px' }}>
          {statusCode === 404
            ? 'This page could not be found.'
            : statusCode === 500
            ? 'A server error occurred.'
            : 'An unexpected error occurred.'}
        </p>
        <Link
          href="/"
          style={{
            padding: '10px 20px',
            background: '#00FF80',
            color: '#1A1A1A',
            textDecoration: 'none',
            borderRadius: '5px',
            fontWeight: 'bold',
            display: 'inline-block',
          }}
        >
          Go to Dashboard
        </Link>
      </div>
    </>
  );
}

Error.getInitialProps = async ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode, hasGetInitialPropsRun: true, err };
};

export default Error;

