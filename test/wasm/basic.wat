(module
  (import "./import.js" "getNumber" (func $getNumber (result i32)))
  (type $t0 (func (param i32 i32) (result i32)))
  (type $t1 (func (param i32) (result i32)))
  (func $add (export "add") (type $t0) (param $p0 i32) (param $p1 i32) (result i32)
    get_local $p1
    get_local $p0
    i32.add)
  (func $addToNumber (export "addToNumber") (type $t1) (param $p0 i32) (result i32)
    call $getNumber
    get_local $p0
    i32.add)
)
