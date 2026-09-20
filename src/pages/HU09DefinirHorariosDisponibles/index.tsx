import React, {useState} from "react";
export default (props) => {
	const [input1, onChangeInput1] = useState('');
	const [input2, onChangeInput2] = useState('');
	const [input3, onChangeInput3] = useState('');
	return (
		<div className="flex flex-col bg-white">
			<div className="self-stretch bg-slate-100 overflow-hidden">
				<div className="flex justify-between items-center self-stretch bg-white py-5 px-12">
					<img
						src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/Lv4nZvy440/ifpkf6t7_expires_30_days.png"} 
						className="w-[81px] h-[81px] object-fill"
					/>
					<div className="flex shrink-0 items-center bg-white gap-[27px]">
						<span className="text-slate-500 text-sm" >
							Mis especialidades
						</span>
						<span className="text-slate-500 text-sm" >
							Mi agenda
						</span>
						<span className="text-slate-500 text-sm" >
							Perfil
						</span>
					</div>
				</div>
				<div className="flex flex-col items-start self-stretch bg-white py-12 pr-16 gap-6">
					<span className="text-slate-900 text-2xl font-bold ml-16" >
						Mi agenda
					</span>
					<span className="text-slate-500 text-sm ml-16" >
						Define tus horarios disponibles para organizar tu agenda de consultas
					</span>
					<div className="flex items-center self-stretch bg-white py-6 ml-16 rounded-xl" 
						style={{
							boxShadow: "0px 4px 16px #0F162812"
						}}>
						<div className="flex flex-col items-start bg-white w-[200px] ml-6 mr-4 gap-1.5">
							<span className="text-slate-900 text-[13px]" >
								Fecha
							</span>
							<input
								placeholder="dd/mm/aaaa"
								value={input1}
								onChange={(event)=>onChangeInput1(event.target.value)}
								className="self-stretch text-slate-500 bg-white text-sm py-3 px-3.5 rounded-lg border border-solid border-slate-200"
							/>
						</div>
						<div className="flex flex-col items-start bg-white w-40 mr-4 gap-1.5">
							<span className="text-slate-900 text-[13px]" >
								Hora inicio
							</span>
							<input
								placeholder="08:00 am"
								value={input2}
								onChange={(event)=>onChangeInput2(event.target.value)}
								className="self-stretch text-slate-500 bg-white text-sm py-3 px-3.5 rounded-lg border border-solid border-slate-200"
							/>
						</div>
						<div className="flex flex-col items-start bg-white w-40 mr-4 gap-1.5">
							<span className="text-slate-900 text-[13px]" >
								Hora fin
							</span>
							<input
								placeholder="12:00 pm"
								value={input3}
								onChange={(event)=>onChangeInput3(event.target.value)}
								className="self-stretch text-slate-500 bg-white text-sm py-3 px-3.5 rounded-lg border border-solid border-slate-200"
							/>
						</div>
						<div className="flex flex-col shrink-0 items-center bg-white pt-[22px]">
							<button className="flex flex-col items-start bg-[#1D6070] text-left py-3.5 px-5 rounded-lg border-0"
								onClick={()=>alert("Pressed!")}>
								<span className="text-white text-[15px] font-bold" >
									Agregar horario
								</span>
							</button>
						</div>
					</div>
					<span className="text-slate-900 text-base font-bold ml-16" >
						Horarios registrados
					</span>
					<div className="self-stretch bg-white ml-16 rounded-xl" 
						style={{
							boxShadow: "0px 4px 12px #0F16280D"
						}}>
						<div className="flex justify-between items-center self-stretch bg-white py-3.5 px-4 border border-solid border-slate-200">
							<div className="flex shrink-0 items-center bg-white gap-[15px]">
								<span className="text-slate-900 text-sm font-bold" >
									Lunes 08 sep
								</span>
								<span className="text-slate-500 text-sm" >
									08:00 am – 12:00 pm
								</span>
							</div>
							<span className="text-green-600 text-[13px]" >
								Disponible
							</span>
						</div>
						<div className="flex justify-between items-center self-stretch bg-white py-3.5 px-4 border border-solid border-slate-200">
							<div className="flex shrink-0 items-center bg-white gap-3.5">
								<span className="text-slate-900 text-sm font-bold" >
									Martes 09 sep
								</span>
								<span className="text-slate-500 text-sm" >
									02:00 pm – 06:00 pm
								</span>
							</div>
							<span className="text-green-600 text-[13px]" >
								Disponible
							</span>
						</div>
						<div className="flex justify-between items-center self-stretch bg-white py-3.5 px-4 border border-solid border-slate-200">
							<div className="flex shrink-0 items-center bg-white gap-3.5">
								<span className="text-slate-900 text-sm font-bold" >
									Miércoles 10 sep
								</span>
								<span className="text-slate-500 text-sm" >
									08:00 am – 12:00 pm
								</span>
							</div>
							<span className="text-green-600 text-[13px]" >
								Disponible
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}