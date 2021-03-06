{
    const half = (note, isTriple) => {
        note.duration = isTriple ? 3 : 2
        return note
    }

    const FlattenScore = (scoreObject, durationFactor, conn) =>{
        return scoreObject.reduce((list, elem, index) => {
            return list.concat( elem.notes ?
                FlattenScore(elem.notes, elem.factor * durationFactor, elem.conn.concat(conn)) :
                (elem.conn ?
                    Object.assign(elem, {duration:elem.duration/durationFactor, "conn" : elem.conn.concat(conn)}) :
                    Object.assign(elem, {duration:elem.duration/durationFactor, "conn" : conn}))
            )}, [])
    }

    const MergeSymbols = function(notes){
        let newNotes = []

        for (var i = 0; i < notes.length; i++) {
            if (notes[i].repeat == "open"){
                i += 1; notes[i].repeat = "open"
            }
            if (notes[i].repeat == "close") {
                newNotes[newNotes.length - 1].repeat = "close";
                i += 1;
            }
            newNotes.push(notes[i])
        }

        return newNotes
    }

    const IndexNote = function(notes){

        return notes.map(function(elem, index){
            elem.index = index;
            return elem;
        })
    }

    const ScoreModel = function(indexed){

        //   console.log(JSON.stringify(indexed));

        return {
            measures : GetMeasures(indexed),
            connects : GetConnectionRanges(indexed)
        }
    }

    const GroupBeat = function(notes, length) {
        let initial = [[]];
        let duration = 0;

        return notes.reduce(function(measures, note){
            if (duration >= length) {
                measures.push([note]);
                duration = note.duration;
            } else {
                measures[measures.length - 1].push(note);
                duration += note.duration;
            }
            return measures;
        }, initial);
    }

    const GroupMeasure = function(notes, length) {
        let initial = [[]];
        let duration = 0;

        return notes.reduce(function(measures, note){
            if (duration >= length) {

                measures.push([note]);
                duration = note.duration;
            } else {
                measures[measures.length - 1].push(note);
                duration += note.duration;
            }
            return measures;
        }, initial);
    }

    let GetMeasures = function(notes){

        let newNotes = notes.map(note => (
            {
                "pitch" : note.pitch,
                "index" : note.index,
                "duration":note.duration,
                "dotted":note.dotted,
                "conn":note.conn,
                "octave":note.octave,
                "accidental":note.accidental,
                "repeat":note.repeat
            }
        ));

        let extendedNotes = []

        newNotes.forEach(function(note){
            if(note.duration > 1){
                extendedNotes.push({pitch: note.pitch, index:note.index, duration: 1, conn:[], octave:note.octave});
                for(let i = 1; i < note.duration; i++){
                    extendedNotes.push({pitch: "–", index:null, duration : 1, conn:[]})
                }
            } else {
                extendedNotes.push(note);
            }
        });

        let mergedExtendedNotes = MergeSymbols(extendedNotes)

        return GroupMeasure(mergedExtendedNotes, 4)
            .map(measure => GroupBeat(measure, 1).map(beat => ({beatNote:beat, underbar:GetUnderbarRanges(beat)})))
    }

    let GetUnderbarRanges = function(notes){

        let curr =[];
        let res  =[];

        let currDuration = 0;

        notes.forEach(function(note){

            if(currDuration <= 1){

                for (var i = 0; i < Math.max(note.conn.length, curr.length); i++) {

                    // curr[i] exists, and have same type with note.conn[i]
                    if(curr[i] && curr[i].type == note.conn[i]){
                        // rewrite (enlonging) current underbar
                        curr[i].end = note.index;

                    } else {

                        // if curr[i] exists, but note.conn[i] doesn't exist, or has
                        // different type to curr[i], the current bar is done.
                        curr[i] && res.push(curr[i]);

                        // if note.conn[i] exists, but curr[i] could be either
                        // not created or finished, assign it with a new object.
                        // if not, then rewrite as undefined.
                        curr[i] = note.conn[i] ? {start:note.index, end:note.index, level:i, type:note.conn[i]} : undefined;
                    }
                }

                currDuration += note.duration;
            }
            if(currDuration >= 1) {

                // if the current measure has been filled up, then
                // push all existing elements into res, and empty
                // the curr.

                for (var i = 0; i < curr.length; i++) {
                    curr[i] && res.push(curr[i]);
                }
            }

        })

        return res;
    }


    let GetConnectionRanges = function(notes){
        let res = [];
        notes.forEach(function(note){

            // inserting the first opening connection point
            (res.length==0 && note.upperConn == "open") && res.push({start:note.index});

            // if res.last exists, and has found another opening
            // connection, push a new element. illegally successive
            // opennings will be omitted.
            (res.length>0 && res[res.length - 1].end && note.upperConn == "open") && res.push({start:note.index});

            // if res.last.end is not being assigned, assign
            // it with the first found closing. The following
            // closings will be omitted.

            if(res.length>0 && !res[res.length-1].end && note.upperConn == "close"){
                res[res.length-1].end = note.index
            }

        })

        return res;
    }

}


Notes "notes"
= _ first:Note rest:(_ Note)* _{

    var all = [first];

    for(let i = 0; i < rest.length; i ++){
        all.push(rest[i][1]);
    }

    return ScoreModel(IndexNote(FlattenScore(all, 1,[])))
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
= note:FixedNote rest:(_ "-")* _ {
    note.duration += rest.length;
    return note;
}
/ halfed:HalfedNote {
    return halfed;
}
/ dotted:DottedNote {
    return dotted;
}
/ repeat:Repeat {
    return repeat;
}

Repeat "repeat"
= _ "|@" _ {
    return {
        repeat : "open"
    }
}
/ _ "@|" _ {
    return {
        repeat : "close"
    }
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
    let oct = text();
    let obj = {};

    if(oct[0] == ','){
        obj.side = "negative";
    } else {
        obj.side = "positive";
    }

    obj.num = parseInt(oct[1])

    return obj;
}

Accidental "accidental"
= [b#n] {
    return text();
}

Pitch "pitch"
= [0-7] { return {pitch : parseInt(text())}; }

_ "whitespace"
= [ \t\n\r]*
