import React from "react";
import BaseNode from "../../BaseNode";

export default function UserInputNode({ id, data = {}, selected }) {
  return <BaseNode id={id} type="userInput" data={data} selected={selected} />;
}
