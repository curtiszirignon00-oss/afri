import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

export const SITE_URL = 'https://www.africbourse.com';

// Canonique par défaut = URL courante sans query ni slash final.
// Les pages qui déclarent leur propre <link rel="canonical"> (montées plus bas
// dans l'arbre) la remplacent : react-helmet-async garde la dernière.
export default function DefaultCanonical() {
  const { pathname } = useLocation();
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : '/';
  return (
    <Helmet>
      <link rel="canonical" href={`${SITE_URL}${path}`} />
    </Helmet>
  );
}
