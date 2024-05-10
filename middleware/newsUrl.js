const newsSources = [
  { url: "https://english.onlinekhabar.com/feed/", source: "Online Khabar English" }, //okk
  { url: "https://www.onlinekhabar.com/feed", source: "Online Khabar Nepali" }, //okk
  { url: "https://english.ratopati.com/rss/", source: "Ratopati English" }, //okkk
  { url: "https://www.ratopati.com/feed", source: "Ratopati Nepali" }, //3 okkk
  { url: "https://en.setopati.com/feed", source: "Setopati English" }, //4 okk
  { url: "https://www.setopati.com/feed", source: "Setopati Nepali" }, //5 okk
  { url: "https://rajdhanidaily.com/feed/", source: "Rajdhani Daily" }, //6 okkk
  { url: "https://nagariknews.nagariknetwork.com/feed", source: "Nagarik News" }, //7 okkk
  { url: "https://nagariknews.nagariknetwork.com/feed", source: "OS Nepal" }, //8 //this is done to avoid error due to index calling in extract method
  { url: "https://abhiyandaily.com/abhiyanrss", source: "Abhiyan Daily" }, //9 okkk
  { url: "https://arthasarokar.com/feed", source: "Arthasarokar" }, //10   okk
  { url: "https://www.karobardaily.com/feed", source: "Karobar Daily" }, //11 okk
  { url: "https://english.khabarhub.com/feed", source: "Khabarhub English" }, //12
  { url: "https://www.himalkhabar.com/feed", source: "Himal Khabar" }, //13 okk
  { url: "https://bizmandu.com/feed", source: "Bizmandu" }, //14 okkk
  { url: "https://www.arthapath.com/feed", source: "Arthapath" }, //15
  { url: "https://www.capitalnepal.com/feed", source: "Capital Nepal" }, //16 okkk
  { url: "https://ukeraa.com/rss/", source: "Ukeraa" }, //17  okkk
  { url: "https://clickmandu.com/feed", source: "Clickmandu" }, //18 okkk
  { url: "https://www.globalaawaj.com/feed", source: "Global Aawaj" },//19 //new from here okkk
  { url: "https://www.nepalviews.com/feed/", source: "Nepal Views" }, //20
  { url: "https://www.nepalpress.com/feed", source: "Nepal Press" }, //21   okkk
  { url: "https://khabarhub.com/feed/", source: "Khabar Hub" }, //22 okk
  { url: "https://www.nepalipatra.com/feed", source: "Nepali Patra" }, //23 //meta property og image okkk
  { url: "https://www.meroauto.com/feed/", source: "Mero Auto" }, //24 //meta property og image okk
  { url: "https://gorkhapatraonline.com/rss", source: "Gorkha Patra" }, //25

];

export default newsSources;

//  { url: "https://nagariknews.nagariknetwork.com/feed", source: "OS Nepal" }, //8
