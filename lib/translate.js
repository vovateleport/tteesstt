'use strict';

var heredoc = require('heredoc');
var XRegExp = require('xregexp').XRegExp;
var context = require('./context');
var misc = require('./misc');
var Html5Entities = require('html-entities').Html5Entities;
var he = new Html5Entities();
var vow = require('vow');

exports.translate = translate;
exports.getSample = getSample;

function translate(req, res){
  _translate(req.body.data)
    .then(function(rv){
      res.status(200).json({ output_text: rv.textResult, output_dict: rv.dict });
    }, function(err){
      console.log('err', JSON.stringify(err));
      res.status(500).json({ err: err });
    });
}

/**
 * @returns {vow.promise}
 */
function _translate(text){
  return loadDictIfNeed().then(function(){
    var rv = processText(text);
    return context.redis_mget(rv.words)
      .then(function(data){
        rv.translated = data;
        fillDict(rv);
        prepareText(text, rv);
        return rv;
      });
  });
}

/**
 * @returns {vow.promise}
 */
function loadDictIfNeed(){
  return context.redis_get('zielkundige')//test dictionary loaded
    .then(function(data){
      if (data)
        return 'OK';
      else {
       console.log('Need to load dictionary.');
       var parse = require('../Data/parse');
       return parse.work();
      }
    });
}

function fillDict(rv){
  rv.dict = {};
  for(var i=0;i<rv.words.length;i++){
    if (rv.translated[i]){
      rv.dict[getKey(rv.words[i])] = rv.translated[i];
    }
  }
}

function prepareText(text, rv){
  var re = createRegex();
  var m;
  var textWord,word, piece;
  var key;
  var prevIndex = re.lastIndex;
  var textResult = [];
  while ((m = re.exec(text)) != null) {
    textWord = m[0];
    piece = text.substring(prevIndex, re.lastIndex-textWord.length);
    textResult.push(he.encode(piece));

    word = getWord(m[0]);
    key = getKey(word);

    if (rv.dict.hasOwnProperty(key)){
      textResult.push(misc.format('<span>{0}</span>',he.encode(textWord)));
    }else{
      textResult.push(he.encode(textWord));
    }
    prevIndex=re.lastIndex;
  }

  piece=text.substring(prevIndex);
  textResult.push(he.encode(piece));

  rv.textResult = textResult.join('');
}

function getWord(textWord){
  return textWord.toLowerCase();
}

function getKey(word){
  //console.log('getKey.word', word);
  return 'k_' + word.toLowerCase();
}

function createRegex(){
  return new XRegExp('[\\p{L}]{2,}','gi');
}

function processText(text){
  //console.log('processText.text', text);
  var re = createRegex();
  var rv = {
    countAll: 0,
    countDistinct:0,
    keys: {},
    words: []
  };

  var gk = getKey;
  var key;
  var word;
  var m;
  while ((m = re.exec(text)) != null) {
    word = getWord(m[0]);
    key = gk(word);
    rv.countAll++;
    if (!rv.keys.hasOwnProperty(key)) {
      rv.keys[key] = 1;
      rv.words.push(word);
    }else
      rv.keys[key]=rv.keys[key]+1;
  }

  rv.countDistinct = rv.words.length;
  return rv;
}

function getSample(reg, res){
  var text = heredoc.strip(function(){/*
   De kentering[bewerken]
   Philips groeide verder door, met in het topjaar 1974 ca. 412.000 medewerkers, waarvan 91.000 in Nederland, maar het Nederlandse personeelsbestand was − met in 1970 98.000 mensen in dienst − toen al over zijn hoogtepunt heen. In Eindhoven verschoven activiteiten van productie naar onderzoek & ontwikkeling en er kwamen meer en meer kantoor- en managementsfuncties. Na 1975 zette zich wereldwijd een daling van het personeelsbestand in. Door toenemende Europese, en later mondiale concurrentie moesten de kosten omlaag; dit gebeurde door in grotere productie-eenheden te produceren.
   De achterstand op het terrein van halfgeleiders trachtte men in te halen via kennisuitwisseling met de Bell-laboratoria van AT&T en later met het peperdure megachip-project. Overigens heeft Philips een succesvolle niche-markt gevonden in de fabricage van specialistische chips, waarbij de massafabricage van standaardchips aan goedkope firma's uit andere landen werd overgelaten, zoals Zuid-Korea en Taiwan.
   Ook op het gebied van computers was er sprake van een achterstand. De mainframecomputer beloofde zeer belangrijk te worden, vooral voor administratieve toepassingen, maar Philips heeft hierin, ondanks de investering van grote sommen geld in Philips Data Systems, nooit enig marktaandeel van betekenis weten te behalen.
   De in die jaren gehoorde uitdrukking: Philips kan niet failliet, refererend aan de zekerheid van overheidssteun, leek een niet te miskennen voorteken. Het bedrijf was door de horizontale en verticale integratie, maar ook door de verregaande autonomie van de vele buitenlandse Philips-ondernemingen, bijna onbestuurbaar geworden. Men sprak in dit kader van een matrixorganisatie. Andere voortekenen van een kentering kwamen uit de Verenigde Staten, waarvandaan veel technologische kennis naar Europa uitweek, omdat daar het door de overheid gefinancierde Apollo-project op zijn einde liep. De exodus was de voorbode van een massale werkloosheid, ook onder technici. Ondertussen werd er bij Philips nogal eens aan hobbyisme gedaan, waarvan de research aan de stirlingmotor een goed, maar duur voorbeeld was.
   Inkrimping en consolidatie[bewerken]
   Automatisering, rationalisering, concentratie op hoofdactiviteiten, samenvoeging van productie-eenheden en verplaatsing van productie naar lage-lonenlanden kondigden zich aan. Toen Henk van Riemsdijk in 1977 aftrad als bestuursvoorzitter, betekende dat de facto het einde van de invloed van de familie Philips en het begin van een minder paternalistische lijn. Dit proces zette medio jaren 70 al in met verplichte arbeidstijdverkorting, terwijl vanaf 1980 ook massa-ontslagen volgden. Het ergste was dat zich tegelijkertijd ook in andere arbeidsintensieve bedrijfstakken, zoals de kunstvezelindustrie en de scheepsbouw, soortgelijke drama's voltrokken. Op dat moment bezat Philips wereldwijd maar liefst 500 fabrieken. In 1982 was het personeelsbestand wereldwijd al teruggelopen van 360.000 tot 336.000 en verdere bezuinigingsoperaties volgden. De belangrijkste daarvan werd Operatie Centurion, geïnitieerd door Jan Timmer. Een groot deel van de Philips-vestigingen werd in het kader van deze operatie afgebouwd en vrijwel alle Philips-activiteiten in Eindhoven werden beëindigd, verplaatst, of verzelfstandigd. De z.g. sterfhuisbedrijfsconstructie werd ingevoerd waarbij het moederbedrijf zo min mogelijk schade opliep als een zelfstandige productie-eenheid werd afgestoten.
   Eind jaren 90 werd het hoofdkantoor van Eindhoven verplaatst naar Amsterdam. Slechts Philips Lighting en Philips Research bleven in Eindhoven. Ook het Evoluon, nog niet zo lang daarvoor het visitekaartje van Philips voor Eindhoven en de wereld, werd in 1989 gesloten als techniekmuseum voor het algemene publiek.
   De aanzienlijke spin-off aan bedrijven die dankzij Philips in de regio Eindhoven waren gevestigd, zorgde ervoor dat het vertrek van Philips niet tot een catastrofe leidde. Een veelheid aan technologisch hoogwaardige bedrijven, waarvan ASML het grootste is, heeft de dynamiek voortgezet die met Philips begonnen is. Ook Philips Medical Systems, in het nabijgelegen Best, is nog een belangrijke Philips-activiteit.
   Internationaal is Philips zich steeds meer gaan oriënteren op consumentenproducten die zich onderscheiden door een opvallend design. Het Senseo-koffieapparaat (2001) en de ambilight televisie (2004) zijn goede voorbeelden. Op de binnenlandse markt sloegen deze wel aan maar opnieuw bleef internationale doorbraak uit. De divisies Componenten en Halfgeleiders werden verkocht, zo werd in 2006 de halfgeleiderdivisie verzelfstandigd als NXP. Tegelijkertijd werd aangekondigd dat het woord "Electronics" uit de bedrijfsnaam zou verdwijnen.
   In 2006 had het bedrijf wereldwijd in meer dan 60 landen 121.732 werknemers in dienst. De researchafdeling, Philips Research, is tegenwoordig gevestigd op de High Tech Campus te Eindhoven, op het terrein van het vroegere Natuurkundig Laboratorium.
   Eind 2010 had Philips 119.000 medewerkers in dienst, in oktober 2011 werd bekend dat Philips 4500 medewerkers wereldwijd laat uitstromen, waarvan 1400 in Nederland (10% van de 14.000 medewerkers).
   In januari 2013 kondigde Philips de verkoop aan van haar Lifestyle Entertainment groep, bestaande uit de onderdelen Audio, Video, Multimedia en Accessories.[3] De koper was het Japanse bedrijf Funai Electric Co. Dit bedrijf zou naast een een licentievergoeding ook € 150 miljoen voor de activiteiten betalen. De producten zouden onder de Philips-merknaam verkocht blijven worden. Eind 2013 is deze transactie afgeketst. In 2014 is een nieuwe overeenkomst gesloten met het Amerikaanse Gibson. Dit onderdeel telt circa 2000 werknemers.
   In september 2014 meldde Philips, nu nog met drie divisies, dat het zal splitsen in twee aparte bedrijven.[4] De Consumer Lifestyle-divisie gaat op in de Healthcare-divisie en gaat verder als HealthTech.[4] De Lighting-divisie krijgt een aparte juridische structuur en dit is de eerste stap tot een splitsing, waarbij andere aandeelhouders kunnen toetreden tot deze divisie.[4] Zou deze organisatie in 2013 al hebben bestaan, dan had HealthTech een omzet gerealiseerd van € 15 miljard en Lighting € 7 miljard.[4] Het zal zeker tot 2016 duren voordat de voorgenomen splitsing is afgerond.[4]
   Overnames[bewerken]
   Philips Lighting ging zich in versnelde mate richten op energiezuinige verlichtingstechniek, waarbij vooral Led technologie de aandacht kreeg. Het concernonderdeel voerde hier een agressievere politiek dan de concurrenten Osram en General Electric. Zo werd er gestreefd naar voorwaartse integratie, waarbij niet alleen lampen, maar ook armaturen werden geleverd. In dit verband voert Philips een politiek van gerichte overnames. Zo kocht Philips in 2005 het bedrijf Lumileds, een fabrikant van ledverlichting. In 2007 werden 5 bedrijven overgenomen: Partners in Lighting dat armaturen voor huishoudens maakt, TIR Systems en Color Kinetics die in ledverlichting actief zijn, Lighting Technologies dat bioscooplampen maakt, en Respironics dat apparatuur tegen slaapapneu vervaardigt. Met deze laatste overname was een bedrag van 3,6 miljard euro gemoeid en vormt daarmee de grootste overname die Philips ooit heeft gedaan. In 2008 heeft Philips het Amerikaanse bedrijf Genlyte overgenomen, dat verlichtingsarmaturen voor bedrijven maakt en marktleider is op de Noord-Amerikaanse markt. In 2009 neemt Philips de Italiaanse koffiemachinefabrikant Saeco over. In 2012 sluit Philips een joint venture met het Chinese TPV Technology onder de naam TP Vision voor het ontwerp, en de productie, distributie, marketing en verkoop van Philips-televisies met uitzondering van China, India, de Verenigde Staten, Canada, Mexico en enkele landen in Zuid-Amerika.
  */});
  res.status(200).json({ data: text});
}