/// <reference types="node" />
// Import des fiches sectorielles Damodaran — couche 2 du moteur de valorisation.
//
// Sources (extraites par script, non ressaisies) :
//   betaGlobal.xls  -> dataset "global"   (96 secteurs)
//   betaemerg.xls   -> dataset "emerging" (96 secteurs)
//   betas.xls       -> dataset "us"       (96 secteurs)
// feuille "Industry Averages" de chacun.
//
// Le beta desendette retenu par defaut dans l'UI est la moyenne des fiches global
// et emergente : la fiche US est un echantillon domestique qui tirerait le beta
// d'un titre BRVM vers le bas sans raison economique. Les trois restent
// selectionnables, et le choix revient a l'utilisateur.
//
// Usage : npx tsx scripts/importDamodaranSectors.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Date de mise a jour des fiches utilisees.
const AS_OF = new Date('2026-01-05');

type SectorRow = {
  sector: string;
  dataset: string;
  number_of_firms: number | null;
  beta: number | null;
  de_ratio: number | null;
  effective_tax: number | null;
  beta_unlevered: number;
  beta_unlevered_cash_adj: number | null;
};

const SECTORS: SectorRow[] = [
  { sector: "Advertising", dataset: 'global', number_of_firms: 419, beta: 1.272832, de_ratio: 0.405549, effective_tax: 0.134711, beta_unlevered: 0.977101, beta_unlevered_cash_adj: 1.086116 },
  { sector: "Aerospace/Defense", dataset: 'global', number_of_firms: 319, beta: 1.230945, de_ratio: 0.130004, effective_tax: 0.109258, beta_unlevered: 1.122078, beta_unlevered_cash_adj: 1.166684 },
  { sector: "Air Transport", dataset: 'global', number_of_firms: 150, beta: 0.990625, de_ratio: 0.788854, effective_tax: 0.14619, beta_unlevered: 0.623536, beta_unlevered_cash_adj: 0.684062 },
  { sector: "Apparel", dataset: 'global', number_of_firms: 1207, beta: 0.762417, de_ratio: 0.187047, effective_tax: 0.152433, beta_unlevered: 0.669026, beta_unlevered_cash_adj: 0.705267 },
  { sector: "Auto & Truck", dataset: 'global', number_of_firms: 165, beta: 1.405958, de_ratio: 0.478107, effective_tax: 0.115674, beta_unlevered: 1.036222, beta_unlevered_cash_adj: 1.145382 },
  { sector: "Auto Parts", dataset: 'global', number_of_firms: 797, beta: 1.449821, de_ratio: 0.277999, effective_tax: 0.172831, beta_unlevered: 1.200709, beta_unlevered_cash_adj: 1.353472 },
  { sector: "Bank (Money Center)", dataset: 'global', number_of_firms: 604, beta: 0.697494, de_ratio: 2.117206, effective_tax: 0.215896, beta_unlevered: 0.270339, beta_unlevered_cash_adj: 0.362765 },
  { sector: "Banks (Regional)", dataset: 'global', number_of_firms: 825, beta: 0.513487, de_ratio: 2.022755, effective_tax: 0.183626, beta_unlevered: 0.204611, beta_unlevered_cash_adj: 0.300363 },
  { sector: "Beverage (Alcoholic)", dataset: 'global', number_of_firms: 217, beta: 0.792671, de_ratio: 0.202934, effective_tax: 0.176197, beta_unlevered: 0.688411, beta_unlevered_cash_adj: 0.725044 },
  { sector: "Beverage (Soft)", dataset: 'global', number_of_firms: 94, beta: 0.592848, de_ratio: 0.187202, effective_tax: 0.133046, beta_unlevered: 0.520175, beta_unlevered_cash_adj: 0.542023 },
  { sector: "Broadcasting", dataset: 'global', number_of_firms: 127, beta: 0.832173, de_ratio: 0.567723, effective_tax: 0.151988, beta_unlevered: 0.584518, beta_unlevered_cash_adj: 0.655771 },
  { sector: "Brokerage & Investment Banking", dataset: 'global', number_of_firms: 623, beta: 0.984614, de_ratio: 1.791363, effective_tax: 0.15368, beta_unlevered: 0.421334, beta_unlevered_cash_adj: 0.489574 },
  { sector: "Building Materials", dataset: 'global', number_of_firms: 469, beta: 1.00483, de_ratio: 0.227795, effective_tax: 0.167168, beta_unlevered: 0.858827, beta_unlevered_cash_adj: 0.902721 },
  { sector: "Business & Consumer Services", dataset: 'global', number_of_firms: 994, beta: 0.992146, de_ratio: 0.206069, effective_tax: 0.158174, beta_unlevered: 0.859902, beta_unlevered_cash_adj: 0.90833 },
  { sector: "Cable TV", dataset: 'global', number_of_firms: 42, beta: 1.096995, de_ratio: 1.241659, effective_tax: 0.100169, beta_unlevered: 0.56938, beta_unlevered_cash_adj: 0.59083 },
  { sector: "Chemical (Basic)", dataset: 'global', number_of_firms: 909, beta: 1.256026, de_ratio: 0.504797, effective_tax: 0.147181, beta_unlevered: 0.912325, beta_unlevered_cash_adj: 1.002147 },
  { sector: "Chemical (Diversified)", dataset: 'global', number_of_firms: 63, beta: 1.169203, de_ratio: 0.525192, effective_tax: 0.211293, beta_unlevered: 0.839974, beta_unlevered_cash_adj: 0.910057 },
  { sector: "Chemical (Specialty)", dataset: 'global', number_of_firms: 952, beta: 1.153627, de_ratio: 0.235151, effective_tax: 0.15726, beta_unlevered: 0.981398, beta_unlevered_cash_adj: 1.042807 },
  { sector: "Coal & Related Energy", dataset: 'global', number_of_firms: 212, beta: 1.14294, de_ratio: 0.199031, effective_tax: 0.106606, beta_unlevered: 0.995127, beta_unlevered_cash_adj: 1.133005 },
  { sector: "Computer Services", dataset: 'global', number_of_firms: 1225, beta: 1.11669, de_ratio: 0.150134, effective_tax: 0.165809, beta_unlevered: 1.004177, beta_unlevered_cash_adj: 1.071577 },
  { sector: "Computers/Peripherals", dataset: 'global', number_of_firms: 343, beta: 1.486105, de_ratio: 0.061903, effective_tax: 0.129341, beta_unlevered: 1.420481, beta_unlevered_cash_adj: 1.468198 },
  { sector: "Construction Supplies", dataset: 'global', number_of_firms: 804, beta: 1.034396, de_ratio: 0.302719, effective_tax: 0.16723, beta_unlevered: 0.843772, beta_unlevered_cash_adj: 0.916676 },
  { sector: "Diversified", dataset: 'global', number_of_firms: 329, beta: 0.797388, de_ratio: 0.48503, effective_tax: 0.151816, beta_unlevered: 0.585463, beta_unlevered_cash_adj: 0.652574 },
  { sector: "Drugs (Biotechnology)", dataset: 'global', number_of_firms: 1193, beta: 1.23079, de_ratio: 0.123499, effective_tax: 0.020812, beta_unlevered: 1.126925, beta_unlevered_cash_adj: 1.180809 },
  { sector: "Drugs (Pharmaceutical)", dataset: 'global', number_of_firms: 1260, beta: 1.06259, de_ratio: 0.149397, effective_tax: 0.103508, beta_unlevered: 0.956001, beta_unlevered_cash_adj: 0.998754 },
  { sector: "Education", dataset: 'global', number_of_firms: 281, beta: 0.811741, de_ratio: 0.286078, effective_tax: 0.145496, beta_unlevered: 0.668925, beta_unlevered_cash_adj: 0.744577 },
  { sector: "Electrical Equipment", dataset: 'global', number_of_firms: 1158, beta: 1.373475, de_ratio: 0.13738, effective_tax: 0.121978, beta_unlevered: 1.245752, beta_unlevered_cash_adj: 1.340641 },
  { sector: "Electronics (Consumer & Office)", dataset: 'global', number_of_firms: 122, beta: 1.197058, de_ratio: 0.163342, effective_tax: 0.132775, beta_unlevered: 1.066989, beta_unlevered_cash_adj: 1.192587 },
  { sector: "Electronics (General)", dataset: 'global', number_of_firms: 1481, beta: 1.598188, de_ratio: 0.141685, effective_tax: 0.118862, beta_unlevered: 1.445357, beta_unlevered_cash_adj: 1.568505 },
  { sector: "Engineering/Construction", dataset: 'global', number_of_firms: 1390, beta: 1.001049, de_ratio: 0.765519, effective_tax: 0.176579, beta_unlevered: 0.637081, beta_unlevered_cash_adj: 0.759317 },
  { sector: "Entertainment", dataset: 'global', number_of_firms: 733, beta: 1.012731, de_ratio: 0.127332, effective_tax: 0.080291, beta_unlevered: 0.924845, beta_unlevered_cash_adj: 0.982077 },
  { sector: "Environmental & Waste Services", dataset: 'global', number_of_firms: 397, beta: 1.101815, de_ratio: 0.356989, effective_tax: 0.128004, beta_unlevered: 0.870023, beta_unlevered_cash_adj: 0.907997 },
  { sector: "Farming/Agriculture", dataset: 'global', number_of_firms: 428, beta: 0.669898, de_ratio: 0.590407, effective_tax: 0.15628, beta_unlevered: 0.465007, beta_unlevered_cash_adj: 0.492671 },
  { sector: "Financial Svcs. (Non-bank & Insurance)", dataset: 'global', number_of_firms: 1138, beta: 0.823488, de_ratio: 2.648145, effective_tax: 0.159055, beta_unlevered: 0.276681, beta_unlevered_cash_adj: 0.295115 },
  { sector: "Food Processing", dataset: 'global', number_of_firms: 1450, beta: 0.673724, de_ratio: 0.371026, effective_tax: 0.163516, beta_unlevered: 0.527626, beta_unlevered_cash_adj: 0.560225 },
  { sector: "Food Wholesalers", dataset: 'global', number_of_firms: 183, beta: 0.684818, de_ratio: 0.582435, effective_tax: 0.174383, beta_unlevered: 0.477334, beta_unlevered_cash_adj: 0.498877 },
  { sector: "Furn/Home Furnishings", dataset: 'global', number_of_firms: 383, beta: 0.96751, de_ratio: 0.257275, effective_tax: 0.153914, beta_unlevered: 0.811666, beta_unlevered_cash_adj: 0.938384 },
  { sector: "Green & Renewable Energy", dataset: 'global', number_of_firms: 258, beta: 0.836653, de_ratio: 0.714296, effective_tax: 0.110033, beta_unlevered: 0.545734, beta_unlevered_cash_adj: 0.5668 },
  { sector: "Healthcare Products", dataset: 'global', number_of_firms: 842, beta: 1.181954, de_ratio: 0.138614, effective_tax: 0.084512, beta_unlevered: 1.071146, beta_unlevered_cash_adj: 1.11651 },
  { sector: "Healthcare Support Services", dataset: 'global', number_of_firms: 478, beta: 0.916559, de_ratio: 0.381262, effective_tax: 0.146225, beta_unlevered: 0.713533, beta_unlevered_cash_adj: 0.778672 },
  { sector: "Heathcare Information and Technology", dataset: 'global', number_of_firms: 430, beta: 1.28992, de_ratio: 0.139584, effective_tax: 0.078581, beta_unlevered: 1.168224, beta_unlevered_cash_adj: 1.207249 },
  { sector: "Homebuilding", dataset: 'global', number_of_firms: 160, beta: 0.960231, de_ratio: 0.399009, effective_tax: 0.197275, beta_unlevered: 0.739903, beta_unlevered_cash_adj: 0.8224 },
  { sector: "Hospitals/Healthcare Facilities", dataset: 'global', number_of_firms: 249, beta: 0.76018, de_ratio: 0.465834, effective_tax: 0.184602, beta_unlevered: 0.564077, beta_unlevered_cash_adj: 0.583851 },
  { sector: "Hotel/Gaming", dataset: 'global', number_of_firms: 656, beta: 0.79843, de_ratio: 0.402402, effective_tax: 0.150648, beta_unlevered: 0.614029, beta_unlevered_cash_adj: 0.656224 },
  { sector: "Household Products", dataset: 'global', number_of_firms: 588, beta: 0.830106, de_ratio: 0.156742, effective_tax: 0.131148, beta_unlevered: 0.743172, beta_unlevered_cash_adj: 0.774144 },
  { sector: "Information Services", dataset: 'global', number_of_firms: 86, beta: 1.023721, de_ratio: 0.319803, effective_tax: 0.198179, beta_unlevered: 0.826468, beta_unlevered_cash_adj: 0.873736 },
  { sector: "Insurance (General)", dataset: 'global', number_of_firms: 204, beta: 0.510236, de_ratio: 0.300615, effective_tax: 0.153815, beta_unlevered: 0.41674, beta_unlevered_cash_adj: 0.473078 },
  { sector: "Insurance (Life)", dataset: 'global', number_of_firms: 143, beta: 0.803781, de_ratio: 0.751349, effective_tax: 0.172495, beta_unlevered: 0.515003, beta_unlevered_cash_adj: 0.794848 },
  { sector: "Insurance (Prop/Cas.)", dataset: 'global', number_of_firms: 248, beta: 0.431827, de_ratio: 0.163368, effective_tax: 0.193769, beta_unlevered: 0.384899, beta_unlevered_cash_adj: 0.412371 },
  { sector: "Investments & Asset Management", dataset: 'global', number_of_firms: 1315, beta: 0.74834, de_ratio: 0.603389, effective_tax: 0.072832, beta_unlevered: 0.515987, beta_unlevered_cash_adj: 0.565713 },
  { sector: "Machinery", dataset: 'global', number_of_firms: 1553, beta: 1.369474, de_ratio: 0.135557, effective_tax: 0.159921, beta_unlevered: 1.243658, beta_unlevered_cash_adj: 1.329622 },
  { sector: "Metals & Mining", dataset: 'global', number_of_firms: 1874, beta: 1.236271, de_ratio: 0.230423, effective_tax: 0.043723, beta_unlevered: 1.054871, beta_unlevered_cash_adj: 1.12561 },
  { sector: "Office Equipment & Services", dataset: 'global', number_of_firms: 139, beta: 0.758696, de_ratio: 0.28569, effective_tax: 0.161925, beta_unlevered: 0.625363, beta_unlevered_cash_adj: 0.711301 },
  { sector: "Oil/Gas (Integrated)", dataset: 'global', number_of_firms: 34, beta: 0.688733, de_ratio: 0.216018, effective_tax: 0.282682, beta_unlevered: 0.593115, beta_unlevered_cash_adj: 0.632468 },
  { sector: "Oil/Gas (Production and Exploration)", dataset: 'global', number_of_firms: 539, beta: 0.885555, de_ratio: 0.358161, effective_tax: 0.089583, beta_unlevered: 0.698776, beta_unlevered_cash_adj: 0.746385 },
  { sector: "Oil/Gas Distribution", dataset: 'global', number_of_firms: 186, beta: 0.653478, de_ratio: 0.6154, effective_tax: 0.121441, beta_unlevered: 0.447811, beta_unlevered_cash_adj: 0.461154 },
  { sector: "Oilfield Svcs/Equip.", dataset: 'global', number_of_firms: 431, beta: 0.948236, de_ratio: 0.396631, effective_tax: 0.13728, beta_unlevered: 0.73166, beta_unlevered_cash_adj: 0.799651 },
  { sector: "Packaging & Container", dataset: 'global', number_of_firms: 438, beta: 0.759135, de_ratio: 0.526469, effective_tax: 0.166652, beta_unlevered: 0.545002, beta_unlevered_cash_adj: 0.575552 },
  { sector: "Paper/Forest Products", dataset: 'global', number_of_firms: 271, beta: 0.88869, de_ratio: 0.780808, effective_tax: 0.125067, beta_unlevered: 0.561497, beta_unlevered_cash_adj: 0.610654 },
  { sector: "Power", dataset: 'global', number_of_firms: 486, beta: 0.713096, de_ratio: 0.858658, effective_tax: 0.178606, beta_unlevered: 0.434598, beta_unlevered_cash_adj: 0.455293 },
  { sector: "Precious Metals", dataset: 'global', number_of_firms: 777, beta: 1.397503, de_ratio: 0.090557, effective_tax: 0.051116, beta_unlevered: 1.309034, beta_unlevered_cash_adj: 1.373938 },
  { sector: "Publishing & Newspapers", dataset: 'global', number_of_firms: 307, beta: 0.816628, de_ratio: 0.279889, effective_tax: 0.150337, beta_unlevered: 0.675524, beta_unlevered_cash_adj: 0.778789 },
  { sector: "R.E.I.T.", dataset: 'global', number_of_firms: 643, beta: 0.564916, de_ratio: 0.800745, effective_tax: 0.039721, beta_unlevered: 0.353604, beta_unlevered_cash_adj: 0.361711 },
  { sector: "Real Estate (Development)", dataset: 'global', number_of_firms: 895, beta: 0.925596, de_ratio: 1.911843, effective_tax: 0.145205, beta_unlevered: 0.381405, beta_unlevered_cash_adj: 0.445943 },
  { sector: "Real Estate (General/Diversified)", dataset: 'global', number_of_firms: 312, beta: 0.927851, de_ratio: 0.885591, effective_tax: 0.142857, beta_unlevered: 0.558638, beta_unlevered_cash_adj: 0.597642 },
  { sector: "Real Estate (Operations & Services)", dataset: 'global', number_of_firms: 752, beta: 0.781762, de_ratio: 0.825024, effective_tax: 0.142715, beta_unlevered: 0.483849, beta_unlevered_cash_adj: 0.514124 },
  { sector: "Recreation", dataset: 'global', number_of_firms: 332, beta: 1.00638, de_ratio: 0.333677, effective_tax: 0.147663, beta_unlevered: 0.805734, beta_unlevered_cash_adj: 0.889971 },
  { sector: "Reinsurance", dataset: 'global', number_of_firms: 32, beta: 0.989466, de_ratio: 0.202796, effective_tax: 0.177444, beta_unlevered: 0.859399, beta_unlevered_cash_adj: 0.952668 },
  { sector: "Restaurant/Dining", dataset: 'global', number_of_firms: 410, beta: 0.754704, de_ratio: 0.26014, effective_tax: 0.152123, beta_unlevered: 0.632005, beta_unlevered_cash_adj: 0.660626 },
  { sector: "Retail (Automotive)", dataset: 'global', number_of_firms: 212, beta: 0.834553, de_ratio: 0.527485, effective_tax: 0.169317, beta_unlevered: 0.59882, beta_unlevered_cash_adj: 0.629806 },
  { sector: "Retail (Building Supply)", dataset: 'global', number_of_firms: 121, beta: 0.944889, de_ratio: 0.259518, effective_tax: 0.184389, beta_unlevered: 0.791577, beta_unlevered_cash_adj: 0.804654 },
  { sector: "Retail (Distributors)", dataset: 'global', number_of_firms: 1079, beta: 0.813594, de_ratio: 0.483356, effective_tax: 0.174825, beta_unlevered: 0.597911, beta_unlevered_cash_adj: 0.642787 },
  { sector: "Retail (General)", dataset: 'global', number_of_firms: 252, beta: 0.982546, de_ratio: 0.130445, effective_tax: 0.176739, beta_unlevered: 0.895379, beta_unlevered_cash_adj: 0.937278 },
  { sector: "Retail (Grocery and Food)", dataset: 'global', number_of_firms: 215, beta: 0.873527, de_ratio: 0.459612, effective_tax: 0.208093, beta_unlevered: 0.650426, beta_unlevered_cash_adj: 0.690517 },
  { sector: "Retail (REITs)", dataset: 'global', number_of_firms: 113, beta: 0.607815, de_ratio: 0.711326, effective_tax: 0.068214, beta_unlevered: 0.397041, beta_unlevered_cash_adj: 0.40731 },
  { sector: "Retail (Special Lines)", dataset: 'global', number_of_firms: 649, beta: 0.960416, de_ratio: 0.18365, effective_tax: 0.169212, beta_unlevered: 0.84465, beta_unlevered_cash_adj: 0.903639 },
  { sector: "Rubber& Tires", dataset: 'global', number_of_firms: 91, beta: 0.94076, de_ratio: 0.441207, effective_tax: 0.180365, beta_unlevered: 0.707725, beta_unlevered_cash_adj: 0.780747 },
  { sector: "Semiconductor", dataset: 'global', number_of_firms: 675, beta: 1.876766, de_ratio: 0.041253, effective_tax: 0.084552, beta_unlevered: 1.820711, beta_unlevered_cash_adj: 1.868897 },
  { sector: "Semiconductor Equip", dataset: 'global', number_of_firms: 391, beta: 2.125767, de_ratio: 0.056091, effective_tax: 0.121859, beta_unlevered: 2.040356, beta_unlevered_cash_adj: 2.117252 },
  { sector: "Shipbuilding & Marine", dataset: 'global', number_of_firms: 359, beta: 0.874399, de_ratio: 0.416944, effective_tax: 0.150623, beta_unlevered: 0.666887, beta_unlevered_cash_adj: 0.787125 },
  { sector: "Shoe", dataset: 'global', number_of_firms: 84, beta: 0.918373, de_ratio: 0.14294, effective_tax: 0.150708, beta_unlevered: 0.829848, beta_unlevered_cash_adj: 0.893819 },
  { sector: "Software (Entertainment)", dataset: 'global', number_of_firms: 298, beta: 1.246407, de_ratio: 0.03137, effective_tax: 0.108731, beta_unlevered: 1.217895, beta_unlevered_cash_adj: 1.234633 },
  { sector: "Software (Internet)", dataset: 'global', number_of_firms: 150, beta: 1.392132, de_ratio: 0.100125, effective_tax: 0.113249, beta_unlevered: 1.29534, beta_unlevered_cash_adj: 1.33704 },
  { sector: "Software (System & Application)", dataset: 'global', number_of_firms: 1532, beta: 1.353955, de_ratio: 0.058356, effective_tax: 0.090352, beta_unlevered: 1.29745, beta_unlevered_cash_adj: 1.33095 },
  { sector: "Steel", dataset: 'global', number_of_firms: 719, beta: 1.128858, de_ratio: 0.473356, effective_tax: 0.145482, beta_unlevered: 0.834174, beta_unlevered_cash_adj: 0.929348 },
  { sector: "Telecom (Wireless)", dataset: 'global', number_of_firms: 101, beta: 0.782418, de_ratio: 0.499675, effective_tax: 0.176699, beta_unlevered: 0.569898, beta_unlevered_cash_adj: 0.602842 },
  { sector: "Telecom. Equipment", dataset: 'global', number_of_firms: 437, beta: 1.327919, de_ratio: 0.096249, effective_tax: 0.082689, beta_unlevered: 1.238925, beta_unlevered_cash_adj: 1.297932 },
  { sector: "Telecom. Services", dataset: 'global', number_of_firms: 283, beta: 0.728978, de_ratio: 0.731809, effective_tax: 0.153961, beta_unlevered: 0.47148, beta_unlevered_cash_adj: 0.496256 },
  { sector: "Tobacco", dataset: 'global', number_of_firms: 48, beta: 0.42728, de_ratio: 0.23662, effective_tax: 0.201301, beta_unlevered: 0.363151, beta_unlevered_cash_adj: 0.374314 },
  { sector: "Transportation", dataset: 'global', number_of_firms: 451, beta: 0.963863, de_ratio: 0.534698, effective_tax: 0.175875, beta_unlevered: 0.688943, beta_unlevered_cash_adj: 0.747463 },
  { sector: "Transportation (Railroads)", dataset: 'global', number_of_firms: 54, beta: 0.719979, de_ratio: 0.474413, effective_tax: 0.241904, beta_unlevered: 0.531721, beta_unlevered_cash_adj: 0.55436 },
  { sector: "Trucking", dataset: 'global', number_of_firms: 130, beta: 0.849781, de_ratio: 0.398745, effective_tax: 0.200288, beta_unlevered: 0.654895, beta_unlevered_cash_adj: 0.677246 },
  { sector: "Utility (General)", dataset: 'global', number_of_firms: 52, beta: 0.503859, de_ratio: 0.762282, effective_tax: 0.185377, beta_unlevered: 0.321156, beta_unlevered_cash_adj: 0.334381 },
  { sector: "Utility (Water)", dataset: 'global', number_of_firms: 106, beta: 0.704596, de_ratio: 0.912719, effective_tax: 0.1609, beta_unlevered: 0.419112, beta_unlevered_cash_adj: 0.445339 },
  { sector: "Total Market", dataset: 'global', number_of_firms: 48156, beta: 1.040286, de_ratio: 0.514787, effective_tax: 0.133105, beta_unlevered: 0.751551, beta_unlevered_cash_adj: 0.832316 },
  { sector: "Total Market (without financials)", dataset: 'global', number_of_firms: 43056, beta: 1.077443, de_ratio: 0.259493, effective_tax: 0.131254, beta_unlevered: 0.902639, beta_unlevered_cash_adj: 0.955364 },
  { sector: "Advertising", dataset: 'emerging', number_of_firms: 184, beta: 1.439916, de_ratio: 0.31585, effective_tax: 0.102805, beta_unlevered: 1.163283, beta_unlevered_cash_adj: 1.280985 },
  { sector: "Aerospace/Defense", dataset: 'emerging', number_of_firms: 151, beta: 1.282566, de_ratio: 0.120301, effective_tax: 0.107443, beta_unlevered: 1.176046, beta_unlevered_cash_adj: 1.256269 },
  { sector: "Air Transport", dataset: 'emerging', number_of_firms: 79, beta: 0.872526, de_ratio: 0.800197, effective_tax: 0.137372, beta_unlevered: 0.544489, beta_unlevered_cash_adj: 0.591801 },
  { sector: "Apparel", dataset: 'emerging', number_of_firms: 993, beta: 0.732439, de_ratio: 0.259781, effective_tax: 0.145016, beta_unlevered: 0.612617, beta_unlevered_cash_adj: 0.666186 },
  { sector: "Auto & Truck", dataset: 'emerging', number_of_firms: 89, beta: 1.350539, de_ratio: 0.402163, effective_tax: 0.139095, beta_unlevered: 1.036653, beta_unlevered_cash_adj: 1.217157 },
  { sector: "Auto Parts", dataset: 'emerging', number_of_firms: 592, beta: 1.524831, de_ratio: 0.184475, effective_tax: 0.161878, beta_unlevered: 1.338873, beta_unlevered_cash_adj: 1.466893 },
  { sector: "Bank (Money Center)", dataset: 'emerging', number_of_firms: 455, beta: 0.585698, de_ratio: 1.789919, effective_tax: 0.215455, beta_unlevered: 0.249485, beta_unlevered_cash_adj: 0.304277 },
  { sector: "Banks (Regional)", dataset: 'emerging', number_of_firms: 104, beta: 0.604031, de_ratio: 5.401253, effective_tax: 0.152972, beta_unlevered: 0.119218, beta_unlevered_cash_adj: 0.1367 },
  { sector: "Beverage (Alcoholic)", dataset: 'emerging', number_of_firms: 132, beta: 0.90571, de_ratio: 0.025931, effective_tax: 0.192342, beta_unlevered: 0.888366, beta_unlevered_cash_adj: 0.952975 },
  { sector: "Beverage (Soft)", dataset: 'emerging', number_of_firms: 40, beta: 0.570851, de_ratio: 0.050103, effective_tax: 0.165891, beta_unlevered: 0.5501, beta_unlevered_cash_adj: 0.579525 },
  { sector: "Broadcasting", dataset: 'emerging', number_of_firms: 63, beta: 0.903263, de_ratio: 0.33043, effective_tax: 0.123804, beta_unlevered: 0.723316, beta_unlevered_cash_adj: 0.856225 },
  { sector: "Brokerage & Investment Banking", dataset: 'emerging', number_of_firms: 468, beta: 0.967498, de_ratio: 2.063839, effective_tax: 0.142592, beta_unlevered: 0.378837, beta_unlevered_cash_adj: 0.424159 },
  { sector: "Building Materials", dataset: 'emerging', number_of_firms: 281, beta: 1.005171, de_ratio: 0.2882, effective_tax: 0.147949, beta_unlevered: 0.825951, beta_unlevered_cash_adj: 0.890683 },
  { sector: "Business & Consumer Services", dataset: 'emerging', number_of_firms: 379, beta: 1.097231, de_ratio: 0.152913, effective_tax: 0.121601, beta_unlevered: 0.98395, beta_unlevered_cash_adj: 1.110808 },
  { sector: "Cable TV", dataset: 'emerging', number_of_firms: 29, beta: 1.103695, de_ratio: 0.23365, effective_tax: 0.091652, beta_unlevered: 0.938584, beta_unlevered_cash_adj: 1.027744 },
  { sector: "Chemical (Basic)", dataset: 'emerging', number_of_firms: 741, beta: 1.306326, de_ratio: 0.462301, effective_tax: 0.145551, beta_unlevered: 0.969037, beta_unlevered_cash_adj: 1.060513 },
  { sector: "Chemical (Diversified)", dataset: 'emerging', number_of_firms: 29, beta: 0.983274, de_ratio: 0.319348, effective_tax: 0.213579, beta_unlevered: 0.792683, beta_unlevered_cash_adj: 0.859413 },
  { sector: "Chemical (Specialty)", dataset: 'emerging', number_of_firms: 687, beta: 1.182251, de_ratio: 0.200563, effective_tax: 0.160102, beta_unlevered: 1.027148, beta_unlevered_cash_adj: 1.106148 },
  { sector: "Coal & Related Energy", dataset: 'emerging', number_of_firms: 96, beta: 0.988056, de_ratio: 0.230301, effective_tax: 0.202167, beta_unlevered: 0.84205, beta_unlevered_cash_adj: 0.967444 },
  { sector: "Computer Services", dataset: 'emerging', number_of_firms: 693, beta: 1.101243, de_ratio: 0.101882, effective_tax: 0.137783, beta_unlevered: 1.022788, beta_unlevered_cash_adj: 1.082244 },
  { sector: "Computers/Peripherals", dataset: 'emerging', number_of_firms: 244, beta: 1.590448, de_ratio: 0.10515, effective_tax: 0.133904, beta_unlevered: 1.473773, beta_unlevered_cash_adj: 1.617776 },
  { sector: "Construction Supplies", dataset: 'emerging', number_of_firms: 580, beta: 0.99734, de_ratio: 0.326475, effective_tax: 0.15294, beta_unlevered: 0.80056, beta_unlevered_cash_adj: 0.90621 },
  { sector: "Diversified", dataset: 'emerging', number_of_firms: 215, beta: 0.697914, de_ratio: 1.22283, effective_tax: 0.150224, beta_unlevered: 0.36337, beta_unlevered_cash_adj: 0.430383 },
  { sector: "Drugs (Biotechnology)", dataset: 'emerging', number_of_firms: 382, beta: 1.423716, de_ratio: 0.084475, effective_tax: 0.032739, beta_unlevered: 1.33858, beta_unlevered_cash_adj: 1.413424 },
  { sector: "Drugs (Pharmaceutical)", dataset: 'emerging', number_of_firms: 753, beta: 1.050897, de_ratio: 0.105889, effective_tax: 0.139463, beta_unlevered: 0.973301, beta_unlevered_cash_adj: 1.050324 },
  { sector: "Education", dataset: 'emerging', number_of_firms: 182, beta: 0.847331, de_ratio: 0.339463, effective_tax: 0.119437, beta_unlevered: 0.674851, beta_unlevered_cash_adj: 0.770201 },
  { sector: "Electrical Equipment", dataset: 'emerging', number_of_firms: 810, beta: 1.4751, de_ratio: 0.160588, effective_tax: 0.129577, beta_unlevered: 1.315988, beta_unlevered_cash_adj: 1.450411 },
  { sector: "Electronics (Consumer & Office)", dataset: 'emerging', number_of_firms: 81, beta: 1.212725, de_ratio: 0.281594, effective_tax: 0.13571, beta_unlevered: 1.000588, beta_unlevered_cash_adj: 1.206291 },
  { sector: "Electronics (General)", dataset: 'emerging', number_of_firms: 1050, beta: 1.765297, de_ratio: 0.160216, effective_tax: 0.11175, beta_unlevered: 1.575277, beta_unlevered_cash_adj: 1.723539 },
  { sector: "Engineering/Construction", dataset: 'emerging', number_of_firms: 999, beta: 1.020138, de_ratio: 1.444944, effective_tax: 0.15916, beta_unlevered: 0.488596, beta_unlevered_cash_adj: 0.612949 },
  { sector: "Entertainment", dataset: 'emerging', number_of_firms: 343, beta: 1.187443, de_ratio: 0.081579, effective_tax: 0.079681, beta_unlevered: 1.11873, beta_unlevered_cash_adj: 1.215782 },
  { sector: "Environmental & Waste Services", dataset: 'emerging', number_of_firms: 223, beta: 1.242503, de_ratio: 0.675542, effective_tax: 0.126288, beta_unlevered: 0.823604, beta_unlevered_cash_adj: 0.890372 },
  { sector: "Farming/Agriculture", dataset: 'emerging', number_of_firms: 312, beta: 0.661048, de_ratio: 0.578033, effective_tax: 0.16181, beta_unlevered: 0.460596, beta_unlevered_cash_adj: 0.498001 },
  { sector: "Financial Svcs. (Non-bank & Insurance)", dataset: 'emerging', number_of_firms: 697, beta: 0.698908, de_ratio: 1.166351, effective_tax: 0.170842, beta_unlevered: 0.372127, beta_unlevered_cash_adj: 0.404143 },
  { sector: "Food Processing", dataset: 'emerging', number_of_firms: 1030, beta: 0.720449, de_ratio: 0.380045, effective_tax: 0.163605, beta_unlevered: 0.560165, beta_unlevered_cash_adj: 0.608327 },
  { sector: "Food Wholesalers", dataset: 'emerging', number_of_firms: 121, beta: 0.641533, de_ratio: 0.800891, effective_tax: 0.151686, beta_unlevered: 0.40021, beta_unlevered_cash_adj: 0.432969 },
  { sector: "Furn/Home Furnishings", dataset: 'emerging', number_of_firms: 278, beta: 1.058682, de_ratio: 0.17222, effective_tax: 0.144854, beta_unlevered: 0.937165, beta_unlevered_cash_adj: 1.105923 },
  { sector: "Green & Renewable Energy", dataset: 'emerging', number_of_firms: 154, beta: 0.855087, de_ratio: 0.662238, effective_tax: 0.131764, beta_unlevered: 0.570591, beta_unlevered_cash_adj: 0.590552 },
  { sector: "Healthcare Products", dataset: 'emerging', number_of_firms: 380, beta: 1.381342, de_ratio: 0.09221, effective_tax: 0.087492, beta_unlevered: 1.291667, beta_unlevered_cash_adj: 1.433944 },
  { sector: "Healthcare Support Services", dataset: 'emerging', number_of_firms: 256, beta: 0.968471, de_ratio: 0.616251, effective_tax: 0.142581, beta_unlevered: 0.661535, beta_unlevered_cash_adj: 0.778451 },
  { sector: "Heathcare Information and Technology", dataset: 'emerging', number_of_firms: 146, beta: 1.559137, de_ratio: 0.065866, effective_tax: 0.081961, beta_unlevered: 1.485471, beta_unlevered_cash_adj: 1.562276 },
  { sector: "Homebuilding", dataset: 'emerging', number_of_firms: 46, beta: 0.711584, de_ratio: 0.704107, effective_tax: 0.109318, beta_unlevered: 0.465051, beta_unlevered_cash_adj: 0.505867 },
  { sector: "Hospitals/Healthcare Facilities", dataset: 'emerging', number_of_firms: 164, beta: 0.716884, de_ratio: 0.207957, effective_tax: 0.184534, beta_unlevered: 0.619836, beta_unlevered_cash_adj: 0.646067 },
  { sector: "Hotel/Gaming", dataset: 'emerging', number_of_firms: 427, beta: 0.704398, de_ratio: 0.453709, effective_tax: 0.156291, beta_unlevered: 0.525044, beta_unlevered_cash_adj: 0.579802 },
  { sector: "Household Products", dataset: 'emerging', number_of_firms: 339, beta: 0.847186, de_ratio: 0.134141, effective_tax: 0.140115, beta_unlevered: 0.769473, beta_unlevered_cash_adj: 0.821014 },
  { sector: "Information Services", dataset: 'emerging', number_of_firms: 49, beta: 1.065802, de_ratio: 0.14123, effective_tax: 0.179827, beta_unlevered: 0.963365, beta_unlevered_cash_adj: 1.02913 },
  { sector: "Insurance (General)", dataset: 'emerging', number_of_firms: 140, beta: 0.37417, de_ratio: 0.308826, effective_tax: 0.143771, beta_unlevered: 0.303583, beta_unlevered_cash_adj: 0.363839 },
  { sector: "Insurance (Life)", dataset: 'emerging', number_of_firms: 92, beta: 0.823081, de_ratio: 0.590641, effective_tax: 0.161976, beta_unlevered: 0.569727, beta_unlevered_cash_adj: 0.7043 },
  { sector: "Insurance (Prop/Cas.)", dataset: 'emerging', number_of_firms: 158, beta: 0.35938, de_ratio: 0.210216, effective_tax: 0.190388, beta_unlevered: 0.310273, beta_unlevered_cash_adj: 0.331507 },
  { sector: "Investments & Asset Management", dataset: 'emerging', number_of_firms: 486, beta: 0.668714, de_ratio: 0.894394, effective_tax: 0.088836, beta_unlevered: 0.399616, beta_unlevered_cash_adj: 0.414602 },
  { sector: "Machinery", dataset: 'emerging', number_of_firms: 987, beta: 1.511374, de_ratio: 0.121978, effective_tax: 0.14079, beta_unlevered: 1.384249, beta_unlevered_cash_adj: 1.495569 },
  { sector: "Metals & Mining", dataset: 'emerging', number_of_firms: 358, beta: 1.546768, de_ratio: 0.250556, effective_tax: 0.151382, beta_unlevered: 1.301288, beta_unlevered_cash_adj: 1.401783 },
  { sector: "Office Equipment & Services", dataset: 'emerging', number_of_firms: 78, beta: 0.749091, de_ratio: 0.177469, effective_tax: 0.141573, beta_unlevered: 0.660797, beta_unlevered_cash_adj: 0.779155 },
  { sector: "Oil/Gas (Integrated)", dataset: 'emerging', number_of_firms: 15, beta: 0.78854, de_ratio: 0.158869, effective_tax: 0.234982, beta_unlevered: 0.704297, beta_unlevered_cash_adj: 0.742614 },
  { sector: "Oil/Gas (Production and Exploration)", dataset: 'emerging', number_of_firms: 105, beta: 0.87491, de_ratio: 0.315416, effective_tax: 0.141325, beta_unlevered: 0.707011, beta_unlevered_cash_adj: 0.813438 },
  { sector: "Oil/Gas Distribution", dataset: 'emerging', number_of_firms: 120, beta: 0.627121, de_ratio: 0.538933, effective_tax: 0.128817, beta_unlevered: 0.446108, beta_unlevered_cash_adj: 0.489818 },
  { sector: "Oilfield Svcs/Equip.", dataset: 'emerging', number_of_firms: 228, beta: 0.922837, de_ratio: 0.37705, effective_tax: 0.155815, beta_unlevered: 0.718787, beta_unlevered_cash_adj: 0.788412 },
  { sector: "Packaging & Container", dataset: 'emerging', number_of_firms: 341, beta: 0.739673, de_ratio: 0.42054, effective_tax: 0.160757, beta_unlevered: 0.561795, beta_unlevered_cash_adj: 0.612399 },
  { sector: "Paper/Forest Products", dataset: 'emerging', number_of_firms: 197, beta: 0.901765, de_ratio: 1.011487, effective_tax: 0.124102, beta_unlevered: 0.511916, beta_unlevered_cash_adj: 0.562614 },
  { sector: "Power", dataset: 'emerging', number_of_firms: 328, beta: 0.773706, de_ratio: 1.044284, effective_tax: 0.173553, beta_unlevered: 0.433148, beta_unlevered_cash_adj: 0.460992 },
  { sector: "Precious Metals", dataset: 'emerging', number_of_firms: 64, beta: 1.576971, de_ratio: 0.149352, effective_tax: 0.159267, beta_unlevered: 1.41757, beta_unlevered_cash_adj: 1.498908 },
  { sector: "Publishing & Newspapers", dataset: 'emerging', number_of_firms: 171, beta: 0.897945, de_ratio: 0.106918, effective_tax: 0.116164, beta_unlevered: 0.831047, beta_unlevered_cash_adj: 1.007606 },
  { sector: "R.E.I.T.", dataset: 'emerging', number_of_firms: 208, beta: 0.447675, de_ratio: 0.57268, effective_tax: 0.024724, beta_unlevered: 0.312803, beta_unlevered_cash_adj: 0.321537 },
  { sector: "Real Estate (Development)", dataset: 'emerging', number_of_firms: 786, beta: 0.959009, de_ratio: 1.967436, effective_tax: 0.141965, beta_unlevered: 0.386497, beta_unlevered_cash_adj: 0.452216 },
  { sector: "Real Estate (General/Diversified)", dataset: 'emerging', number_of_firms: 205, beta: 1.013491, de_ratio: 0.713946, effective_tax: 0.118858, beta_unlevered: 0.659168, beta_unlevered_cash_adj: 0.719302 },
  { sector: "Real Estate (Operations & Services)", dataset: 'emerging', number_of_firms: 406, beta: 0.791719, de_ratio: 0.613223, effective_tax: 0.14093, beta_unlevered: 0.541644, beta_unlevered_cash_adj: 0.58981 },
  { sector: "Recreation", dataset: 'emerging', number_of_firms: 158, beta: 1.039328, de_ratio: 0.235528, effective_tax: 0.118258, beta_unlevered: 0.882785, beta_unlevered_cash_adj: 0.994917 },
  { sector: "Reinsurance", dataset: 'emerging', number_of_firms: 27, beta: 0.976745, de_ratio: 0.321496, effective_tax: 0.163855, beta_unlevered: 0.786395, beta_unlevered_cash_adj: 0.90426 },
  { sector: "Restaurant/Dining", dataset: 'emerging', number_of_firms: 184, beta: 0.819396, de_ratio: 0.134276, effective_tax: 0.123084, beta_unlevered: 0.744164, beta_unlevered_cash_adj: 0.81797 },
  { sector: "Retail (Automotive)", dataset: 'emerging', number_of_firms: 122, beta: 0.817941, de_ratio: 0.744865, effective_tax: 0.165794, beta_unlevered: 0.52405, beta_unlevered_cash_adj: 0.582761 },
  { sector: "Retail (Building Supply)", dataset: 'emerging', number_of_firms: 55, beta: 0.784625, de_ratio: 0.346138, effective_tax: 0.144743, beta_unlevered: 0.622418, beta_unlevered_cash_adj: 0.663997 },
  { sector: "Retail (Distributors)", dataset: 'emerging', number_of_firms: 731, beta: 0.757748, de_ratio: 0.878973, effective_tax: 0.15445, beta_unlevered: 0.455986, beta_unlevered_cash_adj: 0.532707 },
  { sector: "Retail (General)", dataset: 'emerging', number_of_firms: 147, beta: 1.034361, de_ratio: 0.366482, effective_tax: 0.160107, beta_unlevered: 0.810676, beta_unlevered_cash_adj: 0.890169 },
  { sector: "Retail (Grocery and Food)", dataset: 'emerging', number_of_firms: 97, beta: 1.013993, de_ratio: 0.37794, effective_tax: 0.175296, beta_unlevered: 0.789376, beta_unlevered_cash_adj: 0.856215 },
  { sector: "Retail (REITs)", dataset: 'emerging', number_of_firms: 39, beta: 0.60764, de_ratio: 0.607335, effective_tax: 0.056967, beta_unlevered: 0.416974, beta_unlevered_cash_adj: 0.427749 },
  { sector: "Retail (Special Lines)", dataset: 'emerging', number_of_firms: 282, beta: 0.896298, de_ratio: 0.194503, effective_tax: 0.161152, beta_unlevered: 0.781809, beta_unlevered_cash_adj: 0.853284 },
  { sector: "Rubber& Tires", dataset: 'emerging', number_of_firms: 72, beta: 0.924172, de_ratio: 0.380384, effective_tax: 0.178198, beta_unlevered: 0.718423, beta_unlevered_cash_adj: 0.789923 },
  { sector: "Semiconductor", dataset: 'emerging', number_of_firms: 546, beta: 1.944099, de_ratio: 0.065766, effective_tax: 0.086453, beta_unlevered: 1.852379, beta_unlevered_cash_adj: 1.975903 },
  { sector: "Semiconductor Equip", dataset: 'emerging', number_of_firms: 300, beta: 2.179577, de_ratio: 0.142313, effective_tax: 0.107271, beta_unlevered: 1.968641, beta_unlevered_cash_adj: 2.086595 },
  { sector: "Shipbuilding & Marine", dataset: 'emerging', number_of_firms: 252, beta: 0.880449, de_ratio: 0.36941, effective_tax: 0.158458, beta_unlevered: 0.688858, beta_unlevered_cash_adj: 0.842751 },
  { sector: "Shoe", dataset: 'emerging', number_of_firms: 60, beta: 0.814097, de_ratio: 0.205862, effective_tax: 0.166132, beta_unlevered: 0.70485, beta_unlevered_cash_adj: 0.788837 },
  { sector: "Software (Entertainment)", dataset: 'emerging', number_of_firms: 67, beta: 1.538532, de_ratio: 0.084934, effective_tax: 0.10623, beta_unlevered: 1.446062, beta_unlevered_cash_adj: 1.50661 },
  { sector: "Software (Internet)", dataset: 'emerging', number_of_firms: 49, beta: 1.417843, de_ratio: 0.158353, effective_tax: 0.122558, beta_unlevered: 1.266809, beta_unlevered_cash_adj: 1.329191 },
  { sector: "Software (System & Application)", dataset: 'emerging', number_of_firms: 548, beta: 1.584698, de_ratio: 0.052717, effective_tax: 0.082055, beta_unlevered: 1.524201, beta_unlevered_cash_adj: 1.63966 },
  { sector: "Steel", dataset: 'emerging', number_of_firms: 555, beta: 1.157909, de_ratio: 0.508993, effective_tax: 0.143318, beta_unlevered: 0.837111, beta_unlevered_cash_adj: 0.930136 },
  { sector: "Telecom (Wireless)", dataset: 'emerging', number_of_firms: 68, beta: 0.784244, de_ratio: 0.300365, effective_tax: 0.195504, beta_unlevered: 0.639601, beta_unlevered_cash_adj: 0.668444 },
  { sector: "Telecom. Equipment", dataset: 'emerging', number_of_firms: 296, beta: 1.526192, de_ratio: 0.093972, effective_tax: 0.083957, beta_unlevered: 1.425346, beta_unlevered_cash_adj: 1.514878 },
  { sector: "Telecom. Services", dataset: 'emerging', number_of_firms: 142, beta: 0.714358, de_ratio: 0.326361, effective_tax: 0.158454, beta_unlevered: 0.573451, beta_unlevered_cash_adj: 0.614125 },
  { sector: "Tobacco", dataset: 'emerging', number_of_firms: 30, beta: 0.233416, de_ratio: 0.045828, effective_tax: 0.228772, beta_unlevered: 0.225631, beta_unlevered_cash_adj: 0.230535 },
  { sector: "Transportation", dataset: 'emerging', number_of_firms: 330, beta: 1.027493, de_ratio: 0.588071, effective_tax: 0.171849, beta_unlevered: 0.712173, beta_unlevered_cash_adj: 0.793799 },
  { sector: "Transportation (Railroads)", dataset: 'emerging', number_of_firms: 18, beta: 0.958652, de_ratio: 0.376363, effective_tax: 0.257348, beta_unlevered: 0.746984, beta_unlevered_cash_adj: 0.887278 },
  { sector: "Trucking", dataset: 'emerging', number_of_firms: 76, beta: 0.80761, de_ratio: 1.751651, effective_tax: 0.19168, beta_unlevered: 0.348285, beta_unlevered_cash_adj: 0.367381 },
  { sector: "Utility (General)", dataset: 'emerging', number_of_firms: 14, beta: 0.698865, de_ratio: 0.365727, effective_tax: 0.165693, beta_unlevered: 0.547976, beta_unlevered_cash_adj: 0.572474 },
  { sector: "Utility (Water)", dataset: 'emerging', number_of_firms: 76, beta: 0.743869, de_ratio: 0.932438, effective_tax: 0.171107, beta_unlevered: 0.437047, beta_unlevered_cash_adj: 0.472851 },
  { sector: "Total Market", dataset: 'emerging', number_of_firms: 27360, beta: 1.081353, de_ratio: 0.575551, effective_tax: 0.139095, beta_unlevered: 0.754433, beta_unlevered_cash_adj: 0.847901 },
  { sector: "Total Market (without financials)", dataset: 'emerging', number_of_firms: 24760, beta: 1.123049, de_ratio: 0.327753, effective_tax: 0.137221, beta_unlevered: 0.90077, beta_unlevered_cash_adj: 0.987799 },
  { sector: "Advertising", dataset: 'us', number_of_firms: 52, beta: 1.210507, de_ratio: 0.402001, effective_tax: 0.050167, beta_unlevered: 0.930086, beta_unlevered_cash_adj: 1.00801 },
  { sector: "Aerospace/Defense", dataset: 'us', number_of_firms: 79, beta: 0.945491, de_ratio: 0.155626, effective_tax: 0.115753, beta_unlevered: 0.846669, beta_unlevered_cash_adj: 0.869377 },
  { sector: "Air Transport", dataset: 'us', number_of_firms: 23, beta: 1.185465, de_ratio: 0.911706, effective_tax: 0.082926, beta_unlevered: 0.70405, beta_unlevered_cash_adj: 0.757904 },
  { sector: "Apparel", dataset: 'us', number_of_firms: 35, beta: 0.935874, de_ratio: 0.312923, effective_tax: 0.096125, beta_unlevered: 0.757982, beta_unlevered_cash_adj: 0.794563 },
  { sector: "Auto & Truck", dataset: 'us', number_of_firms: 33, beta: 1.456493, de_ratio: 0.196959, effective_tax: 0.037372, beta_unlevered: 1.269033, beta_unlevered_cash_adj: 1.308165 },
  { sector: "Auto Parts", dataset: 'us', number_of_firms: 35, beta: 1.339446, de_ratio: 0.41464, effective_tax: 0.149997, beta_unlevered: 1.021714, beta_unlevered_cash_adj: 1.128305 },
  { sector: "Bank (Money Center)", dataset: 'us', number_of_firms: 15, beta: 0.761046, de_ratio: 1.641897, effective_tax: 0.184348, beta_unlevered: 0.341059, beta_unlevered_cash_adj: 0.443891 },
  { sector: "Banks (Regional)", dataset: 'us', number_of_firms: 568, beta: 0.398477, de_ratio: 0.521023, effective_tax: 0.176097, beta_unlevered: 0.286516, beta_unlevered_cash_adj: 0.374439 },
  { sector: "Beverage (Alcoholic)", dataset: 'us', number_of_firms: 14, beta: 0.812476, de_ratio: 0.433384, effective_tax: 0.123499, beta_unlevered: 0.613172, beta_unlevered_cash_adj: 0.628047 },
  { sector: "Beverage (Soft)", dataset: 'us', number_of_firms: 27, beta: 0.641469, de_ratio: 0.205871, effective_tax: 0.068463, beta_unlevered: 0.555671, beta_unlevered_cash_adj: 0.575465 },
  { sector: "Broadcasting", dataset: 'us', number_of_firms: 24, beta: 0.470752, de_ratio: 0.858543, effective_tax: 0.077289, beta_unlevered: 0.286362, beta_unlevered_cash_adj: 0.315293 },
  { sector: "Brokerage & Investment Banking", dataset: 'us', number_of_firms: 32, beta: 1.171457, de_ratio: 1.355736, effective_tax: 0.152732, beta_unlevered: 0.580849, beta_unlevered_cash_adj: 0.679403 },
  { sector: "Building Materials", dataset: 'us', number_of_firms: 41, beta: 1.111532, de_ratio: 0.259983, effective_tax: 0.180211, beta_unlevered: 0.930162, beta_unlevered_cash_adj: 0.960528 },
  { sector: "Business & Consumer Services", dataset: 'us', number_of_firms: 155, beta: 0.887979, de_ratio: 0.197161, effective_tax: 0.103826, beta_unlevered: 0.773588, beta_unlevered_cash_adj: 0.806025 },
  { sector: "Cable TV", dataset: 'us', number_of_firms: 9, beta: 0.740744, de_ratio: 1.469395, effective_tax: 0.10643, beta_unlevered: 0.352392, beta_unlevered_cash_adj: 0.362877 },
  { sector: "Chemical (Basic)", dataset: 'us', number_of_firms: 29, beta: 1.012247, de_ratio: 0.99354, effective_tax: 0.076839, beta_unlevered: 0.580033, beta_unlevered_cash_adj: 0.636783 },
  { sector: "Chemical (Diversified)", dataset: 'us', number_of_firms: 4, beta: 0.850703, de_ratio: 1.7611, effective_tax: 0, beta_unlevered: 0.366552, beta_unlevered_cash_adj: 0.406143 },
  { sector: "Chemical (Specialty)", dataset: 'us', number_of_firms: 59, beta: 0.969783, de_ratio: 0.29883, effective_tax: 0.136752, beta_unlevered: 0.792227, beta_unlevered_cash_adj: 0.824471 },
  { sector: "Coal & Related Energy", dataset: 'us', number_of_firms: 16, beta: 1.070993, de_ratio: 0.07143, effective_tax: 0.03125, beta_unlevered: 1.016535, beta_unlevered_cash_adj: 1.182438 },
  { sector: "Computer Services", dataset: 'us', number_of_firms: 64, beta: 1.087856, de_ratio: 0.251001, effective_tax: 0.10527, beta_unlevered: 0.91551, beta_unlevered_cash_adj: 0.961701 },
  { sector: "Computers/Peripherals", dataset: 'us', number_of_firms: 36, beta: 1.350329, de_ratio: 0.046247, effective_tax: 0.059114, beta_unlevered: 1.305062, beta_unlevered_cash_adj: 1.324587 },
  { sector: "Construction Supplies", dataset: 'us', number_of_firms: 40, beta: 1.150356, de_ratio: 0.176219, effective_tax: 0.160389, beta_unlevered: 1.016068, beta_unlevered_cash_adj: 1.04683 },
  { sector: "Diversified", dataset: 'us', number_of_firms: 20, beta: 0.880955, de_ratio: 0.155527, effective_tax: 0.02756, beta_unlevered: 0.78893, beta_unlevered_cash_adj: 0.843096 },
  { sector: "Drugs (Biotechnology)", dataset: 'us', number_of_firms: 496, beta: 1.135265, de_ratio: 0.130398, effective_tax: 0.010795, beta_unlevered: 1.034129, beta_unlevered_cash_adj: 1.079454 },
  { sector: "Drugs (Pharmaceutical)", dataset: 'us', number_of_firms: 228, beta: 0.982833, de_ratio: 0.145371, effective_tax: 0.029939, beta_unlevered: 0.886211, beta_unlevered_cash_adj: 0.915136 },
  { sector: "Education", dataset: 'us', number_of_firms: 32, beta: 0.780906, de_ratio: 0.243786, effective_tax: 0.155404, beta_unlevered: 0.660196, beta_unlevered_cash_adj: 0.7196 },
  { sector: "Electrical Equipment", dataset: 'us', number_of_firms: 112, beta: 1.251124, de_ratio: 0.120032, effective_tax: 0.048161, beta_unlevered: 1.147795, beta_unlevered_cash_adj: 1.189807 },
  { sector: "Electronics (Consumer & Office)", dataset: 'us', number_of_firms: 8, beta: 0.865978, de_ratio: 0.058043, effective_tax: 0, beta_unlevered: 0.829853, beta_unlevered_cash_adj: 0.927377 },
  { sector: "Electronics (General)", dataset: 'us', number_of_firms: 114, beta: 0.971477, de_ratio: 0.110118, effective_tax: 0.080364, beta_unlevered: 0.897365, beta_unlevered_cash_adj: 0.937455 },
  { sector: "Engineering/Construction", dataset: 'us', number_of_firms: 48, beta: 1.209972, de_ratio: 0.140115, effective_tax: 0.136353, beta_unlevered: 1.094912, beta_unlevered_cash_adj: 1.137437 },
  { sector: "Entertainment", dataset: 'us', number_of_firms: 92, beta: 0.82517, de_ratio: 0.159139, effective_tax: 0.033044, beta_unlevered: 0.737184, beta_unlevered_cash_adj: 0.762847 },
  { sector: "Environmental & Waste Services", dataset: 'us', number_of_firms: 53, beta: 0.945481, de_ratio: 0.214475, effective_tax: 0.042678, beta_unlevered: 0.814469, beta_unlevered_cash_adj: 0.824769 },
  { sector: "Farming/Agriculture", dataset: 'us', number_of_firms: 35, beta: 1.129174, de_ratio: 0.518485, effective_tax: 0.062944, beta_unlevered: 0.81302, beta_unlevered_cash_adj: 0.845784 },
  { sector: "Financial Svcs. (Non-bank & Insurance)", dataset: 'us', number_of_firms: 176, beta: 0.969713, de_ratio: 2.7213, effective_tax: 0.120566, beta_unlevered: 0.318882, beta_unlevered_cash_adj: 0.327708 },
  { sector: "Food Processing", dataset: 'us', number_of_firms: 78, beta: 0.607453, de_ratio: 0.437339, effective_tax: 0.103726, beta_unlevered: 0.457418, beta_unlevered_cash_adj: 0.469424 },
  { sector: "Food Wholesalers", dataset: 'us', number_of_firms: 13, beta: 0.866642, de_ratio: 0.469686, effective_tax: 0.091528, beta_unlevered: 0.640882, beta_unlevered_cash_adj: 0.64776 },
  { sector: "Furn/Home Furnishings", dataset: 'us', number_of_firms: 27, beta: 0.823158, de_ratio: 0.423334, effective_tax: 0.113825, beta_unlevered: 0.624788, beta_unlevered_cash_adj: 0.65213 },
  { sector: "Green & Renewable Energy", dataset: 'us', number_of_firms: 15, beta: 0.85633, de_ratio: 1.131096, effective_tax: 0, beta_unlevered: 0.463301, beta_unlevered_cash_adj: 0.472284 },
  { sector: "Healthcare Products", dataset: 'us', number_of_firms: 204, beta: 0.908561, de_ratio: 0.127852, effective_tax: 0.048453, beta_unlevered: 0.829063, beta_unlevered_cash_adj: 0.856948 },
  { sector: "Healthcare Support Services", dataset: 'us', number_of_firms: 104, beta: 0.871954, de_ratio: 0.354253, effective_tax: 0.097996, beta_unlevered: 0.688916, beta_unlevered_cash_adj: 0.744875 },
  { sector: "Heathcare Information and Technology", dataset: 'us', number_of_firms: 115, beta: 1.108334, de_ratio: 0.157413, effective_tax: 0.063819, beta_unlevered: 0.991301, beta_unlevered_cash_adj: 1.016325 },
  { sector: "Homebuilding", dataset: 'us', number_of_firms: 30, beta: 0.910618, de_ratio: 0.213442, effective_tax: 0.169892, beta_unlevered: 0.78496, beta_unlevered_cash_adj: 0.853223 },
  { sector: "Hospitals/Healthcare Facilities", dataset: 'us', number_of_firms: 31, beta: 0.799678, de_ratio: 0.599204, effective_tax: 0.113478, beta_unlevered: 0.55173, beta_unlevered_cash_adj: 0.564859 },
  { sector: "Hotel/Gaming", dataset: 'us', number_of_firms: 63, beta: 1.080368, de_ratio: 0.397502, effective_tax: 0.083082, beta_unlevered: 0.832251, beta_unlevered_cash_adj: 0.875688 },
  { sector: "Household Products", dataset: 'us', number_of_firms: 110, beta: 0.815516, de_ratio: 0.181476, effective_tax: 0.065004, beta_unlevered: 0.717816, beta_unlevered_cash_adj: 0.741077 },
  { sector: "Information Services", dataset: 'us', number_of_firms: 15, beta: 0.920567, de_ratio: 0.331698, effective_tax: 0.181628, beta_unlevered: 0.737177, beta_unlevered_cash_adj: 0.756356 },
  { sector: "Insurance (General)", dataset: 'us', number_of_firms: 21, beta: 0.671975, de_ratio: 0.256276, effective_tax: 0.127688, beta_unlevered: 0.56364, beta_unlevered_cash_adj: 0.578072 },
  { sector: "Insurance (Life)", dataset: 'us', number_of_firms: 20, beta: 0.644493, de_ratio: 0.678399, effective_tax: 0.15186, beta_unlevered: 0.427156, beta_unlevered_cash_adj: 0.531748 },
  { sector: "Insurance (Prop/Cas.)", dataset: 'us', number_of_firms: 57, beta: 0.48411, de_ratio: 0.148293, effective_tax: 0.183667, beta_unlevered: 0.435656, beta_unlevered_cash_adj: 0.457023 },
  { sector: "Investments & Asset Management", dataset: 'us', number_of_firms: 283, beta: 0.659582, de_ratio: 0.326882, effective_tax: 0.035349, beta_unlevered: 0.529716, beta_unlevered_cash_adj: 0.588064 },
  { sector: "Machinery", dataset: 'us', number_of_firms: 105, beta: 0.963621, de_ratio: 0.146923, effective_tax: 0.133734, beta_unlevered: 0.867976, beta_unlevered_cash_adj: 0.89403 },
  { sector: "Metals & Mining", dataset: 'us', number_of_firms: 73, beta: 1.043031, de_ratio: 0.109845, effective_tax: 0.025164, beta_unlevered: 0.963643, beta_unlevered_cash_adj: 1.010449 },
  { sector: "Office Equipment & Services", dataset: 'us', number_of_firms: 14, beta: 1.334375, de_ratio: 0.481025, effective_tax: 0.122974, beta_unlevered: 0.980604, beta_unlevered_cash_adj: 1.03819 },
  { sector: "Oil/Gas (Integrated)", dataset: 'us', number_of_firms: 4, beta: 0.299382, de_ratio: 0.13845, effective_tax: 0.28241, beta_unlevered: 0.271219, beta_unlevered_cash_adj: 0.278004 },
  { sector: "Oil/Gas (Production and Exploration)", dataset: 'us', number_of_firms: 142, beta: 0.721406, de_ratio: 0.375876, effective_tax: 0.066645, beta_unlevered: 0.56276, beta_unlevered_cash_adj: 0.578541 },
  { sector: "Oil/Gas Distribution", dataset: 'us', number_of_firms: 23, beta: 0.669222, de_ratio: 0.585271, effective_tax: 0.091662, beta_unlevered: 0.465076, beta_unlevered_cash_adj: 0.469256 },
  { sector: "Oilfield Svcs/Equip.", dataset: 'us', number_of_firms: 97, beta: 0.951242, de_ratio: 0.373606, effective_tax: 0.087464, beta_unlevered: 0.743039, beta_unlevered_cash_adj: 0.787058 },
  { sector: "Packaging & Container", dataset: 'us', number_of_firms: 19, beta: 1.02193, de_ratio: 0.551096, effective_tax: 0.155703, beta_unlevered: 0.723069, beta_unlevered_cash_adj: 0.748992 },
  { sector: "Paper/Forest Products", dataset: 'us', number_of_firms: 6, beta: 0.957978, de_ratio: 0.436882, effective_tax: 0.085985, beta_unlevered: 0.721553, beta_unlevered_cash_adj: 0.769675 },
  { sector: "Power", dataset: 'us', number_of_firms: 46, beta: 0.482433, de_ratio: 0.741487, effective_tax: 0.127483, beta_unlevered: 0.310024, beta_unlevered_cash_adj: 0.314578 },
  { sector: "Precious Metals", dataset: 'us', number_of_firms: 56, beta: 0.836561, de_ratio: 0.072811, effective_tax: 0.059748, beta_unlevered: 0.793243, beta_unlevered_cash_adj: 0.830896 },
  { sector: "Publishing & Newspapers", dataset: 'us', number_of_firms: 19, beta: 0.563007, de_ratio: 0.239399, effective_tax: 0.102058, beta_unlevered: 0.477307, beta_unlevered_cash_adj: 0.511884 },
  { sector: "R.E.I.T.", dataset: 'us', number_of_firms: 190, beta: 0.641798, de_ratio: 0.84463, effective_tax: 0.015814, beta_unlevered: 0.392904, beta_unlevered_cash_adj: 0.400542 },
  { sector: "Real Estate (Development)", dataset: 'us', number_of_firms: 14, beta: 0.843566, de_ratio: 1.018294, effective_tax: 0.04907, beta_unlevered: 0.478288, beta_unlevered_cash_adj: 0.564104 },
  { sector: "Real Estate (General/Diversified)", dataset: 'us', number_of_firms: 12, beta: 0.809986, de_ratio: 0.535602, effective_tax: 0.046483, beta_unlevered: 0.577859, beta_unlevered_cash_adj: 0.626954 },
  { sector: "Real Estate (Operations & Services)", dataset: 'us', number_of_firms: 54, beta: 0.965497, de_ratio: 0.246423, effective_tax: 0.086974, beta_unlevered: 0.814892, beta_unlevered_cash_adj: 0.857586 },
  { sector: "Recreation", dataset: 'us', number_of_firms: 49, beta: 1.023473, de_ratio: 0.629905, effective_tax: 0.114545, beta_unlevered: 0.695091, beta_unlevered_cash_adj: 0.736499 },
  { sector: "Reinsurance", dataset: 'us', number_of_firms: 1, beta: 0.581332, de_ratio: 0.434672, effective_tax: 0.303586, beta_unlevered: 0.438409, beta_unlevered_cash_adj: 0.577702 },
  { sector: "Restaurant/Dining", dataset: 'us', number_of_firms: 64, beta: 0.924087, de_ratio: 0.272198, effective_tax: 0.09916, beta_unlevered: 0.76742, beta_unlevered_cash_adj: 0.783007 },
  { sector: "Retail (Automotive)", dataset: 'us', number_of_firms: 34, beta: 0.936015, de_ratio: 0.453554, effective_tax: 0.107731, beta_unlevered: 0.698433, beta_unlevered_cash_adj: 0.713249 },
  { sector: "Retail (Building Supply)", dataset: 'us', number_of_firms: 14, beta: 1.535309, de_ratio: 0.232892, effective_tax: 0.118399, beta_unlevered: 1.307014, beta_unlevered_cash_adj: 1.317657 },
  { sector: "Retail (Distributors)", dataset: 'us', number_of_firms: 62, beta: 0.948434, de_ratio: 0.282364, effective_tax: 0.145865, beta_unlevered: 0.782683, beta_unlevered_cash_adj: 0.801632 },
  { sector: "Retail (General)", dataset: 'us', number_of_firms: 23, beta: 0.805241, de_ratio: 0.079437, effective_tax: 0.190999, beta_unlevered: 0.759964, beta_unlevered_cash_adj: 0.780928 },
  { sector: "Retail (Grocery and Food)", dataset: 'us', number_of_firms: 15, beta: 1.118304, de_ratio: 0.519502, effective_tax: 0.122215, beta_unlevered: 0.804751, beta_unlevered_cash_adj: 0.848361 },
  { sector: "Retail (REITs)", dataset: 'us', number_of_firms: 26, beta: 0.620739, de_ratio: 0.564198, effective_tax: 0.016033, beta_unlevered: 0.436173, beta_unlevered_cash_adj: 0.442716 },
  { sector: "Retail (Special Lines)", dataset: 'us', number_of_firms: 94, beta: 1.0894, de_ratio: 0.19761, effective_tax: 0.100673, beta_unlevered: 0.948783, beta_unlevered_cash_adj: 1.001878 },
  { sector: "Rubber& Tires", dataset: 'us', number_of_firms: 3, beta: 0.52943, de_ratio: 3.584724, effective_tax: 0, beta_unlevered: 0.143534, beta_unlevered_cash_adj: 0.154358 },
  { sector: "Semiconductor", dataset: 'us', number_of_firms: 66, beta: 1.518199, de_ratio: 0.025911, effective_tax: 0.051064, beta_unlevered: 1.489258, beta_unlevered_cash_adj: 1.504649 },
  { sector: "Semiconductor Equip", dataset: 'us', number_of_firms: 31, beta: 1.397223, de_ratio: 0.048613, effective_tax: 0.099621, beta_unlevered: 1.348073, beta_unlevered_cash_adj: 1.391691 },
  { sector: "Shipbuilding & Marine", dataset: 'us', number_of_firms: 8, beta: 0.752933, de_ratio: 0.225502, effective_tax: 0.052561, beta_unlevered: 0.644013, beta_unlevered_cash_adj: 0.660767 },
  { sector: "Shoe", dataset: 'us', number_of_firms: 11, beta: 1.017318, de_ratio: 0.119447, effective_tax: 0.118612, beta_unlevered: 0.933675, beta_unlevered_cash_adj: 1.000187 },
  { sector: "Software (Entertainment)", dataset: 'us', number_of_firms: 77, beta: 1.028311, de_ratio: 0.020446, effective_tax: 0.052864, beta_unlevered: 1.012781, beta_unlevered_cash_adj: 1.020692 },
  { sector: "Software (Internet)", dataset: 'us', number_of_firms: 29, beta: 1.688676, de_ratio: 0.122989, effective_tax: 0.030544, beta_unlevered: 1.546064, beta_unlevered_cash_adj: 1.590525 },
  { sector: "Software (System & Application)", dataset: 'us', number_of_firms: 309, beta: 1.276648, de_ratio: 0.055771, effective_tax: 0.055098, beta_unlevered: 1.225392, beta_unlevered_cash_adj: 1.248199 },
  { sector: "Steel", dataset: 'us', number_of_firms: 19, beta: 1.062846, de_ratio: 0.235129, effective_tax: 0.09276, beta_unlevered: 0.903514, beta_unlevered_cash_adj: 0.944943 },
  { sector: "Telecom (Wireless)", dataset: 'us', number_of_firms: 12, beta: 0.538135, de_ratio: 0.519467, effective_tax: 0.040231, beta_unlevered: 0.387259, beta_unlevered_cash_adj: 0.392421 },
  { sector: "Telecom. Equipment", dataset: 'us', number_of_firms: 57, beta: 0.92322, de_ratio: 0.092227, effective_tax: 0.070629, beta_unlevered: 0.863491, beta_unlevered_cash_adj: 0.887251 },
  { sector: "Telecom. Services", dataset: 'us', number_of_firms: 39, beta: 0.62872, de_ratio: 0.960632, effective_tax: 0.034003, beta_unlevered: 0.365434, beta_unlevered_cash_adj: 0.3815 },
  { sector: "Tobacco", dataset: 'us', number_of_firms: 10, beta: 0.794315, de_ratio: 0.229685, effective_tax: 0.147673, beta_unlevered: 0.67759, beta_unlevered_cash_adj: 0.690298 },
  { sector: "Transportation", dataset: 'us', number_of_firms: 19, beta: 0.859922, de_ratio: 0.364496, effective_tax: 0.085385, beta_unlevered: 0.675311, beta_unlevered_cash_adj: 0.711527 },
  { sector: "Transportation (Railroads)", dataset: 'us', number_of_firms: 4, beta: 0.975146, de_ratio: 0.277916, effective_tax: 0.169836, beta_unlevered: 0.806948, beta_unlevered_cash_adj: 0.813722 },
  { sector: "Trucking", dataset: 'us', number_of_firms: 26, beta: 1.011349, de_ratio: 0.252316, effective_tax: 0.125984, beta_unlevered: 0.850418, beta_unlevered_cash_adj: 0.868851 },
  { sector: "Utility (General)", dataset: 'us', number_of_firms: 14, beta: 0.239435, de_ratio: 0.814843, effective_tax: 0.127659, beta_unlevered: 0.148613, beta_unlevered_cash_adj: 0.149111 },
  { sector: "Utility (Water)", dataset: 'us', number_of_firms: 14, beta: 0.412683, de_ratio: 0.623594, effective_tax: 0.11192, beta_unlevered: 0.281177, beta_unlevered_cash_adj: 0.282473 },
  { sector: "Total Market", dataset: 'us', number_of_firms: 5994, beta: 0.912111, de_ratio: 0.351712, effective_tax: 0.083017, beta_unlevered: 0.72173, beta_unlevered_cash_adj: 0.755717 },
  { sector: "Total Market (without financials)", dataset: 'us', number_of_firms: 4822, beta: 0.991296, de_ratio: 0.17288, effective_tax: 0.071033, beta_unlevered: 0.877517, beta_unlevered_cash_adj: 0.900968 }
];

// Primes de risque de la fiche pays Damodaran, telles que retenues dans le modele.
// Le libelle doit correspondre a DEFAULT_COUNTRY de valuation.service.ts.
const COUNTRY_PREMIUMS = [{ country: "Cote d'Ivoire", erp: 0.0821, crp: 0.0349 }];

async function main() {
  let sectors = 0;
  for (const row of SECTORS) {
    const { sector, dataset, ...rest } = row;
    await prisma.sectorBeta.upsert({
      where: { sector_dataset_as_of: { sector, dataset, as_of: AS_OF } },
      create: { sector, dataset, as_of: AS_OF, source: 'Damodaran', ...rest },
      update: { ...rest, source: 'Damodaran' }
    });
    sectors += 1;
  }

  for (const p of COUNTRY_PREMIUMS) {
    await prisma.countryRiskPremium.upsert({
      where: { country_as_of: { country: p.country, as_of: AS_OF } },
      create: { ...p, as_of: AS_OF, source: 'Damodaran' },
      update: { erp: p.erp, crp: p.crp, source: 'Damodaran' }
    });
  }

  const water = SECTORS.filter((s) => s.sector === 'Utility (Water)');
  const mean = water.length > 0 ? water.reduce((a, s) => a + s.beta_unlevered, 0) / water.length : null;

  console.log(`${sectors} fiches sectorielles upsertees (${new Set(SECTORS.map((s) => s.dataset)).size} jeux de donnees).`);
  console.log(`${COUNTRY_PREMIUMS.length} fiche(s) pays upsertee(s).`);
  if (mean !== null) {
    console.log(
      `Controle Utility (Water) : ${water
        .map((s) => `${s.dataset} ${s.beta_unlevered.toFixed(4)}`)
        .join(' | ')} — moyenne des 3 ${mean.toFixed(4)}`
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
