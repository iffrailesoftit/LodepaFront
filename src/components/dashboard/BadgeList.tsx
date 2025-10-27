
import { ListadoSalas } from "@/actions/hospital/sala/getListadoSalas";
import Badge from "./Badge"

export default function BadgeList({ data }: { data: ListadoSalas[] }) {
  return (
    <div className="flex flex-col flex-wrap gap-6 p-3 w-full max-w-[95%] mx-auto justify-start items-start">
      {data.map((measurement: ListadoSalas) => (
        <Badge key={measurement.id_sala} data={measurement}  />
      ))}
    </div>
  )
}

