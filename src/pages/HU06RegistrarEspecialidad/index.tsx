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
						src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/Lv4nZvy440/hr9t4az6_expires_30_days.png"} 
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
				<div className="items-start self-stretch bg-white py-14">
					<div className="flex flex-col items-start bg-white w-[560px] p-10 gap-5 rounded-xl" 
						style={{
							boxShadow: "0px 8px 24px #0F162812"
						}}>
						<span className="text-slate-900 text-2xl font-bold" >
							Registrar especialidad
						</span>
						<span className="text-slate-500 text-sm" >
							Define un tipo de consulta que los pacientes podrán seleccionar
						</span>
						<div className="flex flex-col items-start self-stretch bg-white gap-1.5">
							<span className="text-slate-900 text-[13px]" >
								Nombre de la especialidad
							</span>
							<input
								placeholder="Ej. Cardiología"
								value={input1}
								onChange={(event)=>onChangeInput1(event.target.value)}
								className="self-stretch text-slate-500 bg-white text-sm py-3 px-3.5 rounded-lg border border-solid border-slate-200"
							/>
						</div>
						<div className="flex flex-col items-start self-stretch bg-white gap-1.5">
							<span className="text-slate-900 text-[13px]" >
								Descripción
							</span>
							<input
								placeholder="Describe brevemente en qué consiste esta consulta"
								value={input2}
								onChange={(event)=>onChangeInput2(event.target.value)}
								className="self-stretch text-slate-500 bg-white text-sm py-7 px-3.5 rounded-lg border border-solid border-slate-200"
							/>
						</div>
						<div className="flex flex-col items-start self-stretch bg-white gap-1.5">
							<span className="text-slate-900 text-[13px]" >
								Duración de la consulta (minutos)
							</span>
							<input
								placeholder="Ej. 30"
								value={input3}
								onChange={(event)=>onChangeInput3(event.target.value)}
								className="self-stretch text-slate-500 bg-white text-sm py-3 px-3.5 rounded-lg border border-solid border-slate-200"
							/>
						</div>
						<button className="flex flex-col items-center self-stretch bg-[#1D6070] text-left py-3.5 rounded-lg border-0"
							onClick={()=>alert("Pressed!")}>
							<span className="text-white text-[15px] font-bold" >
								Guardar especialidad
							</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}