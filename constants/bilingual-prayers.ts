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
  {
    id: 'angelus',
    title: 'Angelus',
    portuguese: `V. O Anjo do Senhor anunciou a Maria.
R. E ela concebeu do Espírito Santo.

Ave Maria, cheia de graça, o Senhor é convosco; bendita sois vós entre as mulheres, e bendito é o fruto do vosso ventre, Jesus. Santa Maria, Mãe de Deus, rogai por nós, pecadores, agora e na hora de nossa morte. Amém.

V. Eis aqui a serva do Senhor.
R. Faça-se em mim segundo a vossa palavra.

Ave Maria, cheia de graça, o Senhor é convosco; bendita sois vós entre as mulheres, e bendito é o fruto do vosso ventre, Jesus. Santa Maria, Mãe de Deus, rogai por nós, pecadores, agora e na hora de nossa morte. Amém.

V. E o Verbo se fez carne.
R. E habitou entre nós.

Ave Maria, cheia de graça, o Senhor é convosco; bendita sois vós entre as mulheres, e bendito é o fruto do vosso ventre, Jesus. Santa Maria, Mãe de Deus, rogai por nós, pecadores, agora e na hora de nossa morte. Amém.

V. Rogai por nós, Santa Mãe de Deus.
R. Para que sejamos dignos das promessas de Cristo.

Oremos: Infundi, Senhor, em nossas almas a vossa graça; para que nós, que, pela anunciação do Anjo, conhecemos a encarnação de Jesus Cristo, vosso Filho, pela sua paixão e cruz cheguemos à glória da ressurreição. Pelo mesmo Cristo, Senhor nosso. Amém.`,
    latin: `V. Angelus Domini nuntiavit Mariae.
R. Et concepit de Spiritu Sancto.

Ave Maria, gratia plena, Dominus tecum; benedicta tu in mulieribus, et benedictus fructus ventris tui, Iesus. Sancta Maria, Mater Dei, ora pro nobis peccatoribus, nunc et in hora mortis nostrae. Amen.

V. Ecce ancilla Domini.
R. Fiat mihi secundum verbum tuum.

Ave Maria, gratia plena, Dominus tecum; benedicta tu in mulieribus, et benedictus fructus ventris tui, Iesus. Sancta Maria, Mater Dei, ora pro nobis peccatoribus, nunc et in hora mortis nostrae. Amen.

V. Et Verbum caro factum est.
R. Et habitavit in nobis.

Ave Maria, gratia plena, Dominus tecum; benedicta tu in mulieribus, et benedictus fructus ventris tui, Iesus. Sancta Maria, Mater Dei, ora pro nobis peccatoribus, nunc et in hora mortis nostrae. Amen.

V. Ora pro nobis, sancta Dei Genetrix.
R. Ut digni efficiamur promissionibus Christi.

Oremus: Gratiam tuam, quaesumus, Domine, mentibus nostris infunde; ut qui, Angelo nuntiante, Christi Filii tui incarnationem cognovimus, per passionem eius et crucem ad resurrectionis gloriam perducamur. Per eundem Christum Dominum nostrum. Amen.`,
  },
  {
    id: 'credo',
    title: 'Credo',
    portuguese: `Creio em Deus Pai todo-poderoso, Criador do céu e da terra; e em Jesus Cristo, seu único Filho, nosso Senhor; que foi concebido pelo poder do Espírito Santo, nasceu da Virgem Maria, padeceu sob Pôncio Pilatos, foi crucificado, morto e sepultado; desceu à mansão dos mortos; ressuscitou ao terceiro dia; subiu aos céus; está sentado à direita de Deus Pai todo-poderoso, donde há de vir a julgar os vivos e os mortos. Creio no Espírito Santo; na santa Igreja Católica; na comunhão dos santos; na remissão dos pecados; na ressurreição da carne; na vida eterna. Amém.`,
    latin: `Credo in Deum Patrem omnipotentem, Creatorem caeli et terrae; et in Iesum Christum, Filium eius unicum, Dominum nostrum, qui conceptus est de Spiritu Sancto, natus ex Maria Virgine, passus sub Pontio Pilato, crucifixus, mortuus et sepultus; descendit ad inferos; tertia die resurrexit a mortuis; ascendit ad caelos; sedet ad dexteram Dei Patris omnipotentis; inde venturus est iudicare vivos et mortuos. Credo in Spiritum Sanctum; sanctam Ecclesiam catholicam; sanctorum communionem; remissionem peccatorum; carnis resurrectionem; vitam aeternam. Amen.`,
  },
  {
    id: 'sagrada-familia',
    title: 'Oração à Sagrada Família',
    portuguese: `Jesus, Maria e José, em vós contemplamos o esplendor do verdadeiro amor; a vós, confiantes, nos dirigimos. Sagrada Família de Nazaré, fazei também das nossas famílias lugares de comunhão e cenáculos de oração, escolas autênticas do Evangelho e pequenas Igrejas domésticas. Sagrada Família de Nazaré, que nunca mais haja nas famílias episódios de violência, de fechamento e divisão; e quem tiver sido ferido ou escandalizado seja rapidamente consolado e curado. Sagrada Família de Nazaré, fazei tomar consciência a todos do caráter sagrado e inviolável da família, da sua beleza no plano de Deus. Jesus, Maria e José, ouvi-nos e acolhei a nossa súplica. Amém.`,
    latin: `Iesu, Maria et Ioseph, in vobis contemplamur splendorem verae amoris; ad vos confidenter convertimur. Sacra Familia Nazarethana, facite etiam nostras familias communionis loca et orationis cenacula, genuinas Evangelii scholas et parvas Ecclesias domesticas. Sacra Familia Nazarethana, ne umquam amplius in familiis violentiae, clausurae atque divisionis eveniant; et qui laesus aut scandalizatus fuerit, celeriter consolationem et curationem experiatur. Sacra Familia Nazarethana, facite omnes sacrum atque inviolabilem familiae characterem eiusque pulchritudinem in Dei consilio agnoscere. Iesu, Maria et Ioseph, exaudite nos et suscipite supplicationem nostram. Amen.`,
  },
  {
    id: 'vem-espirito-santo',
    title: 'Vem, Espírito Santo',
    portuguese: `Vinde, Espírito Santo, enchei os corações dos vossos fiéis e acendei neles o fogo do vosso amor. Enviai, Senhor, o vosso Espírito e tudo será criado. E renovareis a face da terra.

Oremos: Ó Deus, que instruístes os corações dos vossos fiéis com a luz do Espírito Santo, fazei que apreciemos retamente todas as coisas segundo o mesmo Espírito e gozemos sempre da sua consolação. Por Cristo, Senhor nosso. Amém.`,
    latin: `Veni, Sancte Spiritus, reple tuorum corda fidelium et tui amoris in eis ignem accende. Emitte Spiritum tuum et creabuntur. Et renovabis faciem terrae.

Oremus: Deus, qui corda fidelium Sancti Spiritus illustratione docuisti, da nobis in eodem Spiritu recta sapere et de eius semper consolatione gaudere. Per Christum Dominum nostrum. Amen.`,
  },
  {
    id: 'sao-miguel-arcanjo',
    title: 'São Miguel Arcanjo',
    portuguese: `São Miguel Arcanjo, defendei-nos no combate; sede o nosso refúgio contra as maldades e ciladas do demônio. Ordene-lhe Deus, instantemente o pedimos; e vós, Príncipe da milícia celeste, pela virtude divina, precipitai no inferno a Satanás e aos outros espíritos malignos, que andam pelo mundo para perder as almas. Amém.`,
    latin: `Sancte Michael Archangele, defende nos in proelio; contra nequitiam et insidias diaboli esto praesidium. Imperet illi Deus, supplices deprecamur; tuque, Princeps militiae caelestis, Satanam aliosque spiritus malignos, qui ad perditionem animarum pervagantur in mundo, divina virtute in infernum detrude. Amen.`,
  },
  {
    id: 'oracao-sao-jose',
    title: 'Oração a São José',
    portuguese: `A vós, São José, recorremos em nossa tribulação e, depois de invocar o auxílio de vossa santíssima Esposa, cheios de confiança, solicitamos também o vosso patrocínio. Por esse laço sagrado de caridade que vos uniu à Imaculada Virgem Maria, Mãe de Deus, e pelo amor paternal que tivestes ao Menino Jesus, ardentemente vos suplicamos que lanceis um olhar benigno à herança que Jesus Cristo conquistou com o seu sangue e nos socorrais, nas nossas necessidades, com o vosso auxílio e poder. Protegei, ó guarda providente da Divina Família, o povo eleito de Jesus Cristo; afastai para longe de nós, ó pai amantíssimo, a peste do erro e do vício; assisti-nos do alto do céu, ó nosso fortíssimo sustentáculo, na luta contra o poder das trevas; e, assim como outrora salvastes da morte a vida ameaçada do Menino Jesus, assim também defendei agora a santa Igreja de Deus contra as ciladas dos inimigos e contra toda adversidade. Amparai a cada um de nós com o vosso constante patrocínio, a fim de que, a vosso exemplo e sustentados com o vosso auxílio, possamos viver virtuosamente, morrer piedosamente e obter no céu a eterna bem-aventurança. Amém.`,
    latin: `Ad te, beate Ioseph, in tribulatione nostra confugimus; atque, implorato sanctissimae tuae Sponsae auxilio, fidenter etiam patrocinium tuum exposcimus. Per eam caritatem, qua te cum immaculata Virgine Dei Genetrice coniunxit, et per paternum amorem quo puerum Iesum amplexus es, humiliter deprecamur ut hereditatem, quam Iesus Christus sanguine suo acquisivit, benigno respicias oculo, ac necessitates nostras auxilio tuo et potentia subleves. Tuere, o custodi providentissime divinae Familiae, Iesus Christi sobolem electam; hostem longe a nobis propulsa, amantissime pater, omnis erroris ac vitiorum pestem; pro nobis tuis auxilio de caelo adesto in hac potestate tenebrarum pugna; et sicut olim puerum Iesum e periculo mortis eripuisti, ita nunc sanctam Dei Ecclesiam ab insidiis hostium cunctaque adversitate defende. Nosque singulos tuo perpetuo patrocinio communitos fac ut, tuo exemplo et auxilio adiuti, pie vivere, pie mori, ac in caelesti beatitudine pervenire valeamus. Amen.`,
  },
  {
    id: 'benedictus',
    title: 'Benedictus',
    portuguese: `Bendito seja o Senhor, Deus de Israel, porque visitou e libertou o seu povo; e nos suscitou uma força de salvação na casa de Davi, seu servo, como tinha anunciado desde os tempos antigos, pela boca dos seus santos profetas, para nos libertar dos nossos inimigos e das mãos de todos os que nos odeiam; para exercer a misericórdia com nossos pais e lembrar-se da sua santa aliança e do juramento que fez a Abraão, nosso pai, de nos conceder que, sem temor, libertos das mãos dos inimigos, o sirvamos em santidade e justiça, na sua presença, todos os dias de nossa vida. E tu, menino, serás chamado profeta do Altíssimo, porque irás à frente do Senhor a preparar os seus caminhos, para dar ao seu povo o conhecimento da salvação, pela remissão dos seus pecados, graças à entranhável misericórdia de nosso Deus, com que o Sol nascente nos visitará das alturas, para iluminar os que jazem nas trevas e na sombra da morte, e dirigir nossos passos no caminho da paz.`,
    latin: `Benedictus Dominus Deus Israel, quia visitavit et fecit redemptionem plebis suae, et erexit cornu salutis nobis in domo David pueri sui, sicut locutus est per os sanctorum, qui a saeculo sunt, prophetarum eius, salutem ex inimicis nostris et de manu omnium qui oderunt nos; ad faciendam misericordiam cum patribus nostris et memorari testamenti sui sancti, iusjurandum quod iuravit ad Abraham patrem nostrum, daturum se nobis, ut sine timore, de manu inimicorum liberati, serviamus illi in sanctitate et iustitia coram ipso omnibus diebus nostris. Et tu, puer, propheta Altissimi vocaberis; praeibis enim ante faciem Domini parare vias eius, ad dandam scientiam salutis plebi eius in remissionem peccatorum eorum, per viscera misericordiae Dei nostri, in quibus visitabit nos oriens ex alto, illuminare his qui in tenebris et in umbra mortis sedent, ad dirigendos pedes nostros in viam pacis.`,
  },
  {
    id: 'anjo-da-guarda',
    title: 'Ao Anjo da Guarda',
    portuguese: `Santo Anjo do Senhor, meu zeloso guardador, se a ti me confiou a piedade divina, sempre me rege, me guarda, me governa e me ilumina. Amém.`,
    latin: `Angele Dei, qui custos es mei, me tibi commissum pietate superna; hodie illumina, custodi, rege et guberna. Amen.`,
  },
  {
    id: 'ato-de-contricao',
    title: 'Ato de Contrição',
    portuguese: `Meu Deus, porque sois infinitamente bom e vos amo de todo o coração, arrependo-me de todos os meus pecados e proponho firmemente, com o auxílio da vossa graça, confessar-me, fazer penitência e emendar a minha vida. Amém.`,
    latin: `Deus meus, ex toto corde paenitet me omnium peccatorum meorum, quia peccando non solum poenas a te iuste statutas merui, sed praesertim quia offendi te, summum bonum ac dignum qui super omnia diligaris. Ideo firmiter propono, adiuvante gratia tua, de cetero non peccare et proximam peccandi occasionem fugere. Amen.`,
  },
  {
    id: 'ato-de-caridade',
    title: 'Ato de Caridade',
    portuguese: `Meu Deus, eu vos amo de todo o coração, sobre todas as coisas, porque sois infinitamente bom e nossa eterna felicidade; e, por amor de vós, amo o meu próximo como a mim mesmo. Amém.`,
    latin: `Domine Deus, amo te super omnia et proximum meum propter te, quia tu es summum bonum, infinitum et perfectissimum, omni amore dignum. In hac caritate vivere et mori propono. Amen.`,
  },
  {
    id: 'a-vossa-protecao',
    title: 'À Vossa Proteção',
    portuguese: `À vossa proteção recorremos, Santa Mãe de Deus; não desprezeis as nossas súplicas em nossas necessidades, mas livrai-nos sempre de todos os perigos, ó Virgem gloriosa e bendita.`,
    latin: `Sub tuum praesidium confugimus, sancta Dei Genetrix; nostras deprecationes ne despicias in necessitatibus, sed a periculis cunctis libera nos semper, Virgo gloriosa et benedicta.`,
  },
];
