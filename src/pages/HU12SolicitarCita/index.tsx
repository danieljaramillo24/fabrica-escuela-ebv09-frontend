import React from "react";
export default (props) => {
	return (
		<div className="flex flex-col bg-white">
			<div className="self-stretch bg-slate-100 overflow-hidden">
				<div className="flex justify-between items-center self-stretch bg-white py-5 px-12">
					<img
						src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/Lv4nZvy440/rhoc1459_expires_30_days.png"} 
						className="w-[81px] h-[81px] object-fill"
					/>
					<div className="flex shrink-0 items-center bg-white gap-[27px]">
						<span className="text-slate-500 text-sm" >
							Especialidades
						</span>
						<span className="text-slate-500 text-sm" >
							Mis citas
						</span>
						<span className="text-slate-500 text-sm" >
							Ayuda
						</span>
					</div>
				</div>
				<div className="flex items-center self-stretch bg-white py-12 px-16 gap-8">
					<div className="flex flex-1 flex-col items-start bg-white gap-6">
						<span className="text-slate-900 text-2xl font-bold" >
							Solicitar cita
						</span>
						<span className="text-slate-500 text-sm" >
							Selecciona la especialidad y un horario disponible
						</span>
						<span className="text-slate-900 text-sm font-bold" >
							Especialidad
						</span>
						<div className="flex items-center bg-white gap-2.5">
							<button className="flex flex-col shrink-0 items-start bg-[#1D6070] text-left py-2.5 px-[18px] rounded-lg border-0"
								onClick={()=>alert("Pressed!")}>
								<span className="text-white text-sm" >
									Cardiología
								</span>
							</button>
							<button className="flex flex-col shrink-0 items-start bg-white text-left py-2.5 px-[18px] rounded-lg border border-solid border-slate-200"
								onClick={()=>alert("Pressed!")}>
								<span className="text-slate-900 text-sm" >
									Dermatología
								</span>
							</button>
							<button className="flex flex-col shrink-0 items-start bg-white text-left py-2.5 px-[18px] rounded-lg border border-solid border-slate-200"
								onClick={()=>alert("Pressed!")}>
								<span className="text-slate-900 text-sm" >
									Pediatría
								</span>
							</button>
							<button className="flex flex-col shrink-0 items-start bg-white text-left py-2.5 px-[18px] rounded-lg border border-solid border-slate-200"
								onClick={()=>alert("Pressed!")}>
								<span className="text-slate-900 text-sm" >
									Odontología
								</span>
							</button>
						</div>
						<span className="text-slate-900 text-sm font-bold" >
							Horarios disponibles — Cardiología
						</span>
						<div className="flex items-center bg-white gap-2.5">
							<button className="flex flex-col shrink-0 items-start bg-white text-left py-3 px-[18px] rounded-lg border border-solid border-slate-200"
								onClick={()=>alert("Pressed!")}>
								<span className="text-slate-900 text-[13px]" >
									08:00 am
								</span>
							</button>
							<button className="flex flex-col shrink-0 items-start bg-[#1D6070] text-left py-3 px-[18px] rounded-lg border-0"
								onClick={()=>alert("Pressed!")}>
								<span className="text-white text-[13px]" >
									09:00 am
								</span>
							</button>
							<button className="flex flex-col shrink-0 items-start bg-white text-left py-3 px-[19px] rounded-lg border border-solid border-slate-200"
								onClick={()=>alert("Pressed!")}>
								<span className="text-slate-900 text-[13px]" >
									10:00 am
								</span>
							</button>
							<button className="flex flex-col shrink-0 items-start bg-white text-left py-3 px-[18px] rounded-lg border border-solid border-slate-200"
								onClick={()=>alert("Pressed!")}>
								<span className="text-slate-900 text-[13px]" >
									02:00 pm
								</span>
							</button>
							<button className="flex flex-col shrink-0 items-start bg-white text-left py-3 px-[17px] rounded-lg border border-solid border-slate-200"
								onClick={()=>alert("Pressed!")}>
								<span className="text-slate-900 text-[13px]" >
									03:00 pm
								</span>
							</button>
						</div>
						<span className="text-slate-500 text-xs" >
							Sin disponibilidad para otras especialidades hoy — prueba otra fecha.
						</span>
					</div>
					<div className="flex flex-col items-start bg-white w-[360px] p-7 gap-4 rounded-xl" 
						style={{
							boxShadow: "0px 8px 24px #0F162812"
						}}>
						<span className="text-slate-900 text-[17px] font-bold" >
							Resumen de tu cita
						</span>
						<div className="flex flex-col items-start bg-white gap-0.5">
							<span className="text-slate-500 text-xs mr-[13px]" >
								Especialidad
							</span>
							<span className="text-slate-900 text-[15px] font-bold" >
								Cardiología
							</span>
						</div>
						<div className="flex flex-col items-start bg-white gap-0.5">
							<span className="text-slate-500 text-xs mr-36" >
								Fecha
							</span>
							<span className="text-slate-900 text-[15px] font-bold" >
								Lunes 08 de septiembre
							</span>
						</div>
						<div className="flex flex-col items-start bg-white gap-0.5">
							<span className="text-slate-500 text-xs mr-[45px]" >
								Hora
							</span>
							<span className="text-slate-900 text-[15px] font-bold" >
								09:00 am
							</span>
						</div>
						<button className="flex flex-col items-center self-stretch bg-[#1D6070] text-left py-3.5 rounded-lg border-0"
							onClick={()=>alert("Pressed!")}>
							<span className="text-white text-[15px] font-bold" >
								Confirmar cita
							</span>
						</button>
						<span className="text-slate-500 text-[11px]" >
							Solo usuarios autenticados pueden solicitar citas.
						</span>
					</div>
				</div>
			</div>
		</div>
	)
}