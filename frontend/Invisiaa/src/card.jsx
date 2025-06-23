export default function Card(props) {
    return (
      <div className="flex flex-col justify-center items-center bg-purple-300 w-2/3 h-80 rounded-2xl mt-7 mx-4 hover:scale-102 hover:cursor-pointer duration-300 hover:bg-purple-400 hover:text-white p-6 text-center hover:shadow-2xl shadow-purple-900"
      onClick={props.onClick}>
        
        <h1 className="text-2xl font-bold mb-2">{props.name}</h1>
  
        <h2 className="text-md mb-4">{props.note}</h2>
  
        <ol className="list-decimal list-inside text-left space-y-1">
          {props.steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      </div>
    );
  }
   