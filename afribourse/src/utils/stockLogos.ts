// Static mapping of stock symbols to their local logo files
const LOGO_MAP: Record<string, string> = {
  ABJC: '/logos/logo-ABJC.png',
  BICB: '/logos/logo-BICB.png',
  BICICI: '/logos/logo-BICICI.jfif',
  BNBC: '/logos/logo-BNBC.jfif',
  BOAB: '/logos/logo-BOAB.png',
  BOABF: '/logos/logo-BOABF.jpg',
  BOAC: '/logos/logo-BOAC.png',
  BOAM: '/logos/logo-BOAM.png',
  BOAN: '/logos/logo-BOAN.jpg',
  BOAS: '/logos/logo-BOAS.jpeg',
  CABC: '/logos/logo-CABC.jfif',
  CBIBF: '/logos/logo-CBIBF.jfif',
  CFAC: '/logos/logo-CFAC.jpg',
  CIEC: '/logos/logo-CIEC.jfif',
  ECOC: '/logos/logo-ECOC.png',
  ETIT: '/logos/logo-ETIT.jfif',
  FTSC: '/logos/logo-FTSC.png',
  LNBB: '/logos/logo-LNBB.jpg',
  NEIC: '/logos/logo-NEIC.png',
  NSBC: '/logos/logo-NSBC.jfif',
  NTLC: '/logos/logo-NTLC.jfif',
  ONTBF: '/logos/logo-ONTBF.png',
  ORAC: '/logos/logo-ORAC.jpg',
  ORGT: '/logos/logo-ORGT.png',
  PALC: '/logos/logo-PALC.jfif',
  PRSC: '/logos/logo-PRSC.jfif',
  SAFC: '/logos/logo-SAFC.jfif',
  SCRC: '/logos/logo-SCRC.png',
  SDCC: '/logos/logo-SDCC.jpg',
  SDSC: '/logos/logo-SDSC.png',
  SEMC: '/logos/logo-SEMC.png',
  SGBC: '/logos/logo-SGBC.jpg',
  SHEC: '/logos/logo-SHEC.jpg',
  SIBC: '/logos/logo-SIBC.jpg',
  SICC: '/logos/logo-SICC.png',
  SIVC: '/logos/logo-SIVC.jfif',
  SLBC: '/logos/logo-SLBC.png',
  SMBC: '/logos/logo-SMBC.png',
  SNTS: '/logos/logo-SNTS.jfif',
  SOGC: '/logos/logo-SOGC.png',
  SPHC: '/logos/logo-SPHC.png',
  STAC: '/logos/logo-STAC.png',
  STBC: '/logos/logo-STBC.jpg',
  SVOC: '/logos/logo-SVOC.png',
  TTLC: '/logos/logo-TTLC.svg',
  TTLS: '/logos/logo-TTLS.svg',
  UNLC: '/logos/logo-UNLC.jfif',
  UNXC: '/logos/logo-UNXC.png',
};

/**
 * Returns the logo URL for a given stock symbol.
 * Checks the local static map first, then falls back to a remote URL if provided.
 */
export function getStockLogo(symbol: string, remoteUrl?: string | null): string | null {
  const local = LOGO_MAP[symbol?.toUpperCase()];
  if (local) return local;
  return remoteUrl ?? null;
}
