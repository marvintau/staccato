{
    const half = (note, isTriple) => {
        note.duration = isTriple ? 3 : 2
        return note
    }

    const Flatten = (scoreObject, durFactor, conn) =>{
        return scoreObject.reduce((list, elem) => {

            let dur = elem.duration/durFactor;

            return list.concat( elem.notes ?
            Flatten(elem.notes, elem.factor * durFactor, elem.conn.concat(conn)) :
            (elem.conn ?
                Object.assign(elem, {duration:dur, "conn" : elem.conn.concat(conn)}) :
                Object.assign(elem, {duration:dur, "conn" : conn}))
            )}, [])
    }

    const GroupBeat = function(notes) {
        let duration = 0;

        let beats = [{notes:[]}];
        notes.forEach(note =>{
            duration += note.duration;
            (duration <= 1) && beats[beats.length - 1].notes.push(note);

            if(duration == 1){
                duration = 0;
                beats.push({notes : []});
            }
        })

        beats.forEach(beat =>{
            beat.underbar = GetDurations(beat.notes);
        })
        return beats;
    }

    let GetDurations = function(notes){

        let curr =[];
        let res  =[];

        notes.forEach(function(note, noteIndex){

            for (var i = 0; i < Math.max(note.conn.length, curr.length); i++) {

                // current underbar exists, and have same type with underbar of current note
                // then enlong the current underbar
                if(curr[i] && curr[i].type == note.conn[i]){
                    curr[i].end = noteIndex;

                } else {

                    // if current underbar exists, but underbar of current note doesn't exist,
                    // or has different type to current underbar, the current bar is done.
                    curr[i] && res.push(curr[i]);

                    // if the ith underbar of current note exists, but the ith current underbar
                    // could be either not created or finished, assign it with a new object.
                    // if not, then rewrite as undefined.
                    curr[i] = note.conn[i] ? {start:noteIndex, end:noteIndex, level:i, type:note.conn[i]} : undefined;
                }
            }

            delete note.conn
        })

        for (var i = 0; i < curr.length; i++) {
            curr[i] && res.push(curr[i]);
        }

        return res;
    }


    let GetConnectionRanges = function(measures){
        let res = [];

        let slot = 0;
        let isConnecting = false;
        let slots = [];

        measures.forEach(function(measure, index){
            measure.beats.forEach(function(beat, beatIndex){
                beat.notes.forEach(function(note, noteIndex){

                    if(note.pitch != "–"){
                        slots.push({measure:index, beat:beatIndex, note:noteIndex})
                    }

                    if((res.length==0 || (res.length>0 && res[res.length - 1].end)) && note.upperConn == "open") {
                        res.push({start:{measure:index, beat:beatIndex, note:noteIndex}});
                        isConnecting = true;
                    }

                    if(res.length>0 && !res[res.length-1].end && note.upperConn == "close"){
                        res[res.length-1].end = {measure:index, beat:beatIndex, note:noteIndex}
                        isConnecting = false;
                    }

                    delete note.upperConn
                })
            })
        })
        return {ranges:res, slots:slots};
    }

    let zipMeasure = (chorus, parts) => {

        chorus.measures = chorus[parts[0]]["measures"].map((_) => ({}))
        chorus.connections = {}


        chorus[parts[0]].measures.forEach( (_, index) => {
            parts.forEach(part => {
                chorus.measures[index][part] = chorus[part].measures[index];
                chorus.measures[index].measureType = chorus[part].measures[index].measureType.measureType;
            })

            chorus.measures[index] = zipBeat(chorus.measures[index], parts)
        })

        let identical = parts.every(part => {
            return JSON.stringify(chorus[part].connections.slots) == JSON.stringify(chorus[parts[0]].connections.slots)
        })

        if(identical){
            chorus.connections.unison = chorus[parts[0]].connections;
        } else {
            parts.forEach(part => {
                chorus.connections[part] = chorus[part].connections
            })
        }

        for (var part of parts) {
            delete chorus[part];
        }

        return chorus;
    }

    let zipBeat = (measure, parts) => {
        measure.beats = measure[parts[0]]["beats"].map((_) => ({}))

        measure[parts[0]].beats.forEach( (_, index) => {
            parts.forEach(part => {

                measure[part].beats[index].notes.forEach(note =>{
                    delete note.conn
                })

                measure.beats[index][part] = measure[part].beats[index]
            })
        })

        for (var part of parts) {
            delete measure[part];
        }

        return measure;
    }

    let zipLyric = (lyrics) => lyrics[0].map((verse,i) => lyrics.map(verse => verse[i]))

    let groupBy = function(xs, key) {
        return xs.reduce(function(rv, x) {
            (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
      }, {});
    };
}

Sections "all sections"
= _ sections:Section* {

    let score = {}, chorus={}, parts = [], verses= [];
    sections.forEach(elem => {
        if(elem.name == "parts"){
            parts = elem.parts;
        } else if(elem.name == "verse"){
            verses.push(elem);
        } else if(elem.name == "chorus"){
            chorus[elem.part] = elem.content;
        } else {
            score[elem.name] = elem.content
        }
    })

    let groupedLyric = groupBy(verses, 'part')
    for(var part in groupedLyric){
        groupedLyric[part] = zipLyric(groupedLyric[part].map(lyric => lyric.verse))
    }

    let zippedChorus = zipMeasure(chorus, parts)

    if(chorus.connections.unison){
        if(groupedLyric.unison){
            chorus.connections.unison.slots.forEach((slot, index) =>{
                // 要把这里换一下，不是直接把index的歌词加进来，而是把属于同一个Beat的歌词加入进来
                // 然后在Beat中进行进一步渲染
                if(!zippedChorus.measures[slot.measure].beats[slot.beat].lyric){
                        zippedChorus.measures[slot.measure].beats[slot.beat].lyric = [];
                }
                zippedChorus.measures[slot.measure].beats[slot.beat].lyric[slot.note] = groupedLyric.unison[index]
            })
        }
    }

    // console.log(zippedChorus.measures.map(measure => measure.beats));

    zippedChorus.parts = parts;
    score.chorus = zippedChorus;
    return score;
}

Section "section that contains different info"
= "chorus" _ part:[a-zA-Z]+ _ "{" measures:Measures "}" _ {
    return {
        name : "chorus",
        part : part.join(""),
        content : measures
    };
}
/ "verse" _ verseNumber:[0-9]+ _ '{' _ lyric:([^ \t\n\r\}]+ _)* '}' _ {
    return {
        name : "verse",
        part : "unison",
        verse : lyric.map(l => l[0].join(""))
    };
}
/ "verse" _ verseNumber:[0-9]+ _ part:[a-zA-Z]+ _ '{' _ lyric:([^ \t\n\r\}]+ _)* '}' _ {
    return {
        name : "verse",
        part : part.join(""),
        verse : lyric.map(l => l[0].join(""))
    };
}
/ "parts" _ '{' _ parts:([a-zA-Z]+ _)* '}' _ {
    return {
        name : "parts",
        parts : parts.map(elem => elem[0].join(""))
    };
}
/ section:[a-zA-Z]+ _ '{' content:[^\}]* '}' _ {
    return {
        name : section.join(""),
        content : content.join("")
    }
}

Measures "measures"
= measures:Measure* {

    let measureList = {
        measures : measures,
        connections : GetConnectionRanges(measures)
    }

    return measureList
}

Measure "measure"
= notes:Notes _ bar:MeasureBar _ {

    let flattenedNotes = Flatten(notes, 1, []).map((note, index) =>
        Object.assign(note, {
            octave: note.octave ? {start:(note.octave>0 ? 0 : note.conn.length), nums:note.octave} : undefined
        })
    );
    let durationExtendedBeats = [];

    flattenedNotes.forEach(note => {
        durationExtendedBeats.push(note);
        for (let i = 0; i < note.duration - 1; i++) {
            durationExtendedBeats.push({
                pitch : "-",
                duration : 1
            })
        }

        if(note.duration > 1){
            note.duration = 1
        }
    })

    let beats = GroupBeat(durationExtendedBeats);

    return {
        beats : beats,
        measureType : bar
    }
}

Notes "notes"
= _ first:Note rest:(_ Note)* _{

    var all = [first];

    for(let i = 0; i < rest.length; i ++){
        all.push(rest[i][1]);
    }

    return all;
}

HalfedNote "duration"
= "(" _  first:Note _ next:Note _ ")" {

    return {
        notes : [first, next],
        factor : 2,
        conn : ["halfed"]
    }
}
/ "(" _ first:Note _ next:Note _ last:Note _ ")" {

    first.tripleConn = "open",
    last.tripleConn = "close"

    return {
        notes : [first, next, last],
        factor : 3,
        conn : ["triple"]
    }
}

DottedNote "dotted"
= "." first:FixedNote _ next:FixedNote {

    first.dotted = true;

    next.conn.push("halfed");

    return {
        notes : [first, next],
        factor : 1,
        conn : []
    }
}

Note "note"
= note:FixedNote _ {
    return note;
}
/ halfed:HalfedNote {
    return halfed;
}
/ dotted:DottedNote {
    return dotted;
}

FixedNote "fixed"
= "/" note:ModifiedPitch _ {
    note.duration = 1;
    note.upperConn = "open";
    note.conn = []
    return note;
}

/ note:ModifiedPitch "\\" _ {
    note.duration = 1;
    note.upperConn = "close";
    note.conn = []
    return note;
}
/ note:ModifiedPitch _ {
    note.duration = 1;
    note.conn = []
    return note
}


ModifiedPitch "modified_pitch"
= acc:Accidental pitch:Pitch octave:Octave {
    pitch.accidental = acc;
    pitch.octave = octave;
    return pitch;
}
/ acc:Accidental pitch:Pitch {
    pitch.accidental = acc;
    return pitch;
}

/ pitch:Pitch octave:Octave {
    pitch.octave = octave;
    return pitch
}
/ pitch:Pitch {
    return pitch
}

Octave "octave"
= [,'][1-3] {

    return (text()[0] == ',') ? - parseInt(text()[1]) : parseInt(text()[1])

}

Accidental "accidental"
= [b#n] {
    return text();
}

Pitch "pitch"
= [0-7] {
    return {pitch : parseInt(text())};
}
/ "-" {
    return {pitch : "–"}
}

MeasureBar "measure bar"
= "||" _ {
    return {measureType : "fin"}
}
/ "\:|" _ {
    return {measureType : "rep_fin"}
}
/ "|\:" _ {
    return {measureType : "rep_start"}
}
/ "|" _ {
    return {measureType : "normal"}
}


_ "whitespace"
= [ \t\n\r]*
