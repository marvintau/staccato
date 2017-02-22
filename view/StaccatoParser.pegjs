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

    const GroupBeat = function(notes, length) {
        let duration = 0;

        return notes.reduce(function(measures, note){
            if (duration >= length) {
                measures[measures.length - 1].underbar = GetDurations(measures[measures.length - 1].notes);
                measures.push({notes : [note]});
                duration = note.duration;
            } else {
                measures[measures.length - 1].notes.push(note);
                duration += note.duration;
            }
            return measures;
        }, [{notes:[]}]);
    }

    let GetDurations = function(notes){

        let curr =[];
        let res  =[];

        let currDuration = 0;

        notes.forEach(function(note, noteIndex){

            for (var i = 0; i < Math.max(note.conn.length, curr.length); i++) {

                // curr[i] exists, and have same type with note.conn[i]
                if(curr[i] && curr[i].type == note.conn[i]){
                    // rewrite (enlonging) current underbar
                    console.log(curr[i])
                    curr[i].end = noteIndex;

                } else {

                    // if curr[i] exists, but note.conn[i] doesn't exist, or has
                    // different type to curr[i], the current bar is done.
                    curr[i] && res.push(curr[i]);

                    // if note.conn[i] exists, but curr[i] could be either
                    // not created or finished, assign it with a new object.
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

        measures.forEach(function(measure, index){
            measure.beats.forEach(function(beat, beatIndex){
                beat.notes.forEach(function(note, noteIndex){
                    if((res.length==0 || (res.length>0 && res[res.length - 1].end)) && note.upperConn == "open") {
                        res.push({start:{measure:index, beat:beatIndex, note:noteIndex}});
                    }

                    if(res.length>0 && !res[res.length-1].end && note.upperConn == "close"){
                        res[res.length-1].end = {measure:index, beat:beatIndex, note:noteIndex}
                    }

                    delete note.upperConn
                })
            })
        })


        return res;
    }

    let zipMeasure = (obj, parts) => {

        obj.measures = obj[parts[0]]["measures"].map((_) => [])
        obj[parts[0]].measures.forEach( (_, index) => {
            parts.forEach(part => {
                obj.measures[index].part = part;
                obj.measures[index][part] = obj[part].measures[index]
            })
        })

        return obj;
    }

    let zipNote = (obj, parts) => {
        obj.beats = obj[parts[0]]["beats"].map((_) => ({}))
        obj[parts[0]].beats.forEach( (_, index) => {
            parts.forEach(part => {
                obj.beats[index][part] = obj[part].beats[index]
            })
        })

        return obj;
    }

    let zipUnderbar = (obj, parts) => {
        obj.underbars = obj[parts[0]]["underbars"].map((_) => ({}))
        parts.forEach(part => {
            obj.underbars[index][part] = obj[part].underbars[index]
        })

        return obj;
    }

}

Sections "all sections"
= _ sections:Section* {

    let score = {}, chorus={};
    sections.forEach(elem => {
        if(elem.name == "chorus"){
            chorus[elem.part] = elem.content;
        } else {
            score[elem.name] = elem.content
        }
    })

    // console.log(JSON.stringify(zipMeasure(chorus, ["soprano","alto"]).measures.map(measure => zipUnderbar(measure, ["soprano", "alto"])), null, 4))
    console.log(JSON.stringify(chorus, null, 4))
    return score
}

Section "section that contains different info"
= "chorus" _ part:[a-zA-Z]+ _ "{" measures:Measures "}" _ {
    return {
        name : "chorus",
        part : part.join(""),
        content : measures
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
    // let connections = GetConnectionRanges(measures);

    let measureList = {
        measures : measures
        // connections : connections
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

    let beats = GroupBeat(durationExtendedBeats, 1)
    // console.log(JSON.stringify(underbars, null, 4))

    return {
        beats : beats,
        measure : bar
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
    return {pitch : text()}
}

MeasureBar "measure bar"
= "||" _ {
    return {measure : "fin"}
}
/ "\:|" _ {
    return {measure : "rep_fin"}
}
/ "|\:" _ {
    return {measure : "rep_start"}
}
/ "|" _ {
    return {measure : "normal"}
}


_ "whitespace"
= [ \t\n\r]*
