export type BilingualPrayer = {
  id: string;
  title: string;
  portuguese: string;
  latin: string;
};

export const bilingualPrayers: BilingualPrayer[] = [
  {
    id: 'salve-rainha',
    title: 'Salve Rainha',
    portuguese:
      'Salve, Rainha, Mãe de misericórdia; vida, doçura e esperança nossa, salve. A vós bradamos, os degredados filhos de Eva. A vós suspiramos, gemendo e chorando neste vale de lágrimas. Eia, pois, advogada nossa, esses vossos olhos misericordiosos a nós volvei. E depois deste desterro, mostrai-nos Jesus, bendito fruto do vosso ventre. Ó clemente, ó piedosa, ó doce sempre Virgem Maria. Rogai por nós, santa Mãe de Deus, para que sejamos dignos das promessas de Cristo. Amém.',
    latin:
      'Salve, Regina, mater misericordiae; vita, dulcedo, et spes nostra, salve. Ad te clamamus, exsules filii Hevae. Ad te suspiramus, gementes et flentes in hac lacrimarum valle. Eia ergo, advocata nostra, illos tuos misericordes oculos ad nos converte. Et Iesum, benedictum fructum ventris tui, nobis post hoc exsilium ostende. O clemens, O pia, O dulcis Virgo Maria. Ora pro nobis, sancta Dei Genetrix, ut digni efficiamur promissionibus Christi. Amen.',
  },
  {
    id: 'magnificat',
    title: 'Magnificat',
    portuguese:
      'A minha alma engrandece o Senhor, e o meu espírito se alegra em Deus, meu Salvador; porque olhou para a humildade de sua serva; doravante todas as gerações me chamarão bem-aventurada; porque o Poderoso fez em mim maravilhas, e Santo é o seu nome. Sua misericórdia se estende, de geração em geração, sobre os que o temem. Manifestou o poder do seu braço: dispersou os soberbos de coração. Derrubou do trono os poderosos e exaltou os humildes. Encheu de bens os famintos, e despediu os ricos de mãos vazias. Acolheu Israel, seu servo, lembrado de sua misericórdia, conforme prometera aos nossos pais, em favor de Abraão e de sua descendência, para sempre. Amém.',
    latin:
      'Magnificat anima mea Dominum; et exsultavit spiritus meus in Deo salutari meo, quia respexit humilitatem ancillae suae. Ecce enim ex hoc beatam me dicent omnes generationes, quia fecit mihi magna qui potens est, et sanctum nomen eius, et misericordia eius in progenies et progenies timentibus eum. Fecit potentiam in brachio suo; dispersit superbos mente cordis sui. Deposuit potentes de sede et exaltavit humiles. Esurientes implevit bonis et divites dimisit inanes. Suscepit Israel puerum suum, recordatus misericordiae suae, sicut locutus est ad patres nostros, Abraham et semini eius in saecula. Amen.',
  },
  {
    id: 'pater-noster',
    title: 'Pai-Nosso (Pater Noster)',
    portuguese:
      'Pai nosso que estais no céu, santificado seja o vosso nome; venha a nós o vosso reino; seja feita a vossa vontade, assim na terra como no céu; o pão nosso de cada dia nos dai hoje; perdoai-nos as nossas ofensas, assim como nós perdoamos a quem nos tem ofendido; e não nos deixeis cair em tentação, mas livrai-nos do mal. Amém.',
    latin:
      'Pater noster, qui es in caelis, sanctificetur nomen tuum; adveniat regnum tuum; fiat voluntas tua, sicut in caelo et in terra. Panem nostrum quotidianum da nobis hodie; et dimitte nobis debita nostra, sicut et nos dimittimus debitoribus nostris; et ne nos inducas in tentationem; sed libera nos a malo. Amen.',
  },
  {
    id: 'ave-maria',
    title: 'Ave-Maria',
    portuguese:
      'Ave Maria, cheia de graça, o Senhor é convosco; bendita sois vós entre as mulheres, e bendito é o fruto do vosso ventre, Jesus. Santa Maria, Mãe de Deus, rogai por nós, pecadores, agora e na hora de nossa morte. Amém.',
    latin:
      'Ave Maria, gratia plena, Dominus tecum; benedicta tu in mulieribus, et benedictus fructus ventris tui, Iesus. Sancta Maria, Mater Dei, ora pro nobis peccatoribus, nunc et in hora mortis nostrae. Amen.',
  },
  {
    id: 'gloria-patri',
    title: 'Glória ao Pai (Gloria Patri)',
    portuguese:
      'Glória ao Pai, ao Filho e ao Espírito Santo. Como era no princípio, agora e sempre. Amém.',
    latin:
      'Gloria Patri, et Filio, et Spiritui Sancto. Sicut erat in principio, et nunc, et semper, et in saecula saeculorum. Amen.',
  },
];
