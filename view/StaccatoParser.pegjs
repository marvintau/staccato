{
  const FlattenScore = (scoreObject, durationFactor, conn) =>{
    return scoreObject.reduce((list, elem, index) => {
        return list.concat( elem.notes ?
            FlattenScore(elem.notes, elem.factor * durationFactor, elem.conn.concat(conn)) :
            (elem.conn ? Object.assign(elem, {duration:elem.duration/durationFactor, "conn" : elem.conn.concat(conn)}) : Object.assign(elem, {duration:elem.duration/durationFactor, "conn" : conn}))
        )}, [])
    };

  const half = (note, isTriple) => {
    	note.duration = isTriple ? 3 : 2
    return note
  }

  const IndexNote = function(notes){
      return notes.map(function(elem, index){
          elem.index = index;
          return elem;
      })
  }

  const ScoreModel = function(indexed){

      console.log(JSON.stringify(indexed));

      return {
          measures : GetDurationOnly(indexed),
          underbars : GetUnderbarRanges(indexed),
          accidentals : GetAccidentals(indexed),
          connects : GetConnectionRanges(indexed),
          octaves : GetOctaves(indexed)
      }
  }

  let GetDurationOnly = function(notes){
      return notes.map(note => (
          {
              "pitch" : note.pitch,
              "index" : note.index,
              "duration":note.duration,
              "dotted":note.dotted,
              "octave":note.octave
          }
      ));
  }

  let GetOctaves = function(notes){

      let res = [];

      notes.forEach(function(note){
          note.octave && res.push({index: note.index, octave:note.octave, underbars:note.conn.length});
      })

      return res;
  }

  let GetUnderbarRanges = function(notes){

      let curr =[];
      let res  =[];

      let currDuration = 0;

      notes.forEach(function(note){

          if(currDuration <= 1){

              for (var i = 0; i < Math.max(note.conn.length, curr.length); i++) {

                  // condition of rewriting current underbar:
                  // curr[i] exists, and have same type with note.conn[i],
                  if(curr[i] && curr[i].type == note.conn[i]){

                      curr[i].end = note.index;

                  } else {

                      // if curr[i] exists, but note.conn[i] doesn't exist,
                      // or has different type to curr[i], the current bar
                      // is done.
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
              // the curr. So that we can seperate all underbars
              // belonging to different measures.

              for (var i = 0; i < curr.length; i++) {
                  curr[i] && res.push(curr[i]);
              }

              currDuration = 0;
              curr = [];
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

  let GetAccidentals = function(notes){
      let res = [];
      notes.forEach(function(note){
          note.accidental && res.push({index : note.index, accidental : note.accidental});
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
  = [b#n] { return text(); }

Pitch "pitch"
  = [0-7] { return {pitch : parseInt(text())}; }

_ "whitespace"
  = [ \t\n\r]*
