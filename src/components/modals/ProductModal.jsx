import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { Image as ImageIcon, Barcode } from "lucide-react";
import {
  validate,
  isNotEmpty,
  isPositive,
  hasNoSpecialChars,
  minLength,
  maxLength,
  maxDecimals,
  isInRange,
  greaterThanOrEqual,
  isValidBarcode,
  isEAN13
} from "../../utils/validators";
import { errorMessages } from "../../utils/validationMessages";
import { useAuth } from "../../context/AuthContext";

const ProductModal = ({ isOpen, onClose, onSave, product = null }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    precio_costo: "",
    precio_venta: "",
    barcode: "",
    categoria: "",
    image_url: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [barcodeError, setBarcodeError] = useState("");
  const [categories, setCategories] = useState([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const barcodeInputRef = React.useRef(null);
  const { token } = useAuth(); // Get token from AuthContext

  useEffect(() => {
    if (isOpen) {
      const fetchCategories = async () => {
        try {
          const response = await fetch("http://localhost:4000/api/categories", {
            headers: {
              "x-auth-token": token, // Include the token in the headers
            },
          });
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          const data = await response.json();
          setCategories(data);
        } catch (error) {
          console.error("Error al obtener las categorías:", error);
        }
      };
      fetchCategories();

      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
      if (product) {
        setFormData({
          nombre: product.name || "",
          descripcion: product.description || "",
          precio_costo: product.precio_costo || "",
          precio_venta: product.precio_venta || "",
          barcode: product.barcode || "",
          categoria: product.categoria || "",
          image_url: product.image_url || "",
        });
        setCategorySearch(product.categoria || "");
        setImagePreview(product.image_url || "");
      } else {
        setFormData({
          nombre: "",
          descripcion: "",
          precio_costo: "",
          precio_venta: "",
          barcode: "",
          categoria: "",
          image_url: "",
        });
        setCategorySearch("");
        setImageFile(null);
        setImagePreview("");
      }
      setBarcodeError("");
      setErrors({}); // Limpiar errores al abrir/cambiar de producto
    }
  }, [product, isOpen]);

  useEffect(() => {
    if (scannedBarcode) {
      setFormData((prev) => ({ ...prev, barcode: scannedBarcode }));
      checkBarcode(scannedBarcode);
    }
  }, [scannedBarcode]);

  const checkBarcode = async (barcode) => {
    if (!barcode) {
      setBarcodeError("");
      return;
    }
    if (product && product.barcode === barcode) {
      setBarcodeError("");
      return;
    }
    try {
      const response = await fetch(
        `http://localhost:4000/api/products/check-barcode/${barcode}`
      );
      const data = await response.json();
      if (data.exists) {
        setBarcodeError("Este código de barras ya está en uso.");
      } else {
        setBarcodeError("");
      }
    } catch (error) {
      console.error("Error al verificar el código de barras:", error);
      setBarcodeError("");
    }
  };

  const handleBarcodeKeyDown = (e) => {
    if (e.key === "Enter" && e.target.value) {
      e.preventDefault();
      setScannedBarcode(e.target.value);
      e.target.value = "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleCategoryChange = (e) => {
    const { value } = e.target;
    setCategorySearch(value);
    setFormData((prev) => ({ ...prev, categoria: value }));
    if (errors.categoria) {
      setErrors(prev => ({ ...prev, categoria: null }));
    }
    if (!isCategoryDropdownOpen) {
      setIsCategoryDropdownOpen(true);
    }
  };

  const selectCategory = (categoryName) => {
    setCategorySearch(categoryName);
    setFormData((prev) => ({ ...prev, categoria: categoryName }));
    if (errors.categoria) {
      setErrors(prev => ({ ...prev, categoria: null }));
    }
    setIsCategoryDropdownOpen(false);
  };

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // Resize image before storing
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const MAX_SIZE = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to JPEG at 70% quality
          const resizedBase64 = canvas.toDataURL("image/jpeg", 0.7);
          setImagePreview(resizedBase64);
          setFormData((prev) => ({ ...prev, image_url: resizedBase64 }));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreview(product?.image_url || "");
      setFormData((prev) => ({ ...prev, image_url: "" }));
    }
  };

  const handleSubmit = async () => {
    const validations = [
      { field: 'nombre', validator: isNotEmpty, message: errorMessages.productNameRequired },
      { field: 'nombre', validator: minLength(2), message: errorMessages.productNameMinLength },
      { field: 'nombre', validator: maxLength(100), message: errorMessages.productNameMaxLength },
      { field: 'nombre', validator: hasNoSpecialChars, message: errorMessages.productNoSpecialChars },
      { field: 'precio_costo', validator: isNotEmpty, message: errorMessages.priceRequired },
      { field: 'precio_costo', validator: isPositive, message: errorMessages.pricePositive },
      { field: 'precio_costo', validator: maxDecimals(2), message: errorMessages.priceDecimals },
      { field: 'precio_costo', validator: isInRange(0.01, 999999999.99), message: errorMessages.priceTooHigh },
      { field: 'precio_venta', validator: isNotEmpty, message: errorMessages.priceRequired },
      { field: 'precio_venta', validator: isPositive, message: errorMessages.pricePositive },
      { field: 'precio_venta', validator: maxDecimals(2), message: errorMessages.priceDecimals },
      { field: 'precio_venta', validator: isInRange(0.01, 999999999.99), message: errorMessages.priceTooHigh },
      { field: 'precio_venta', validator: greaterThanOrEqual('precio_costo'), message: errorMessages.priceVentaMayor },
      { field: 'barcode', validator: isNotEmpty, message: errorMessages.barcodeRequired },
      { field: 'barcode', validator: isValidBarcode, message: errorMessages.barcodeFormat },
      { field: 'categoria', validator: isNotEmpty, message: errorMessages.categoryRequired },
    ];

    // Validate description length if provided
    if (formData.descripcion && formData.descripcion.trim()) {
      validations.push(
        { field: 'descripcion', validator: maxLength(150), message: errorMessages.descriptionMaxLength }
      );
    }

    // Optional: Validate EAN-13 checksum if barcode is 13 digits
    if (formData.barcode && formData.barcode.length === 13) {
      validations.push(
        { field: 'barcode', validator: isEAN13, message: errorMessages.barcodeEAN13 }
      );
    }

    const validationErrors = validate(validations, formData);

    if (Object.keys(validationErrors).length > 0 || barcodeError) {
      setErrors(validationErrors);
      // Show alert with all validation errors
      const errorList = Object.values(validationErrors).filter(Boolean).join('\n• ');
      if (errorList) {
        alert(`Por favor, corrija los siguientes errores:\n• ${errorList}`);
      } else if (barcodeError) {
        alert("Por favor, corrija los errores antes de guardar. El código de barras ya está en uso.");
      }
      return;
    }

    setErrors({});
    const dataToSave = { ...formData };

    const urlPattern = new RegExp("^(https?:\/\/|data:image\/)");
    if (dataToSave.image_url && !urlPattern.test(dataToSave.image_url)) {
      dataToSave.image_url = "";
    }

    await onSave(dataToSave, imageFile);
    onClose();
  };

  const getInputClass = (fieldName) => {
    const baseClass = "mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm";
    const errorClass = "border-red-500 ring-red-500";
    const normalClass = "border-gray-300 focus:ring-havelock-blue-400 focus:border-havelock-blue-400";
    return `${baseClass} ${errors[fieldName] ? errorClass : normalClass}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <input
        ref={barcodeInputRef}
        type="text"
        onKeyDown={handleBarcodeKeyDown}
        style={{ position: "absolute", left: "-9999px" }}
      />
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        {product ? "Editar Producto" : "Agregar Producto"}
      </h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        noValidate
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label
              htmlFor="nombre"
              className="block text-sm font-medium text-gray-700"
            >
              Nombre
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Mouse Inalámbrico RGB"
              className={getInputClass('nombre')}
            />
            {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
          </div>
          <div>
            <label
              htmlFor="barcode"
              className="block text-sm font-medium text-gray-700"
            >
              Código de Barras
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                id="barcode"
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
                onBlur={(e) => checkBarcode(e.target.value)}
                placeholder="Ej: 7501234567890"
                className={`flex-1 block w-full px-3 py-2 border rounded-l-md focus:outline-none sm:text-sm ${barcodeError || errors.barcode
                  ? "border-red-500 ring-red-500"
                  : "border-gray-300 focus:ring-havelock-blue-400 focus:border-havelock-blue-400"
                  }`}
              />
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 rounded-r-md hover:bg-gray-100"
                onClick={() => {
                  /* TODO: Implement scanner */
                }}
              >
                <Barcode className="h-5 w-5" />
              </button>
            </div>
            {barcodeError && (
              <p className="mt-2 text-sm text-red-600">{barcodeError}</p>
            )}
            {errors.barcode && <p className="text-red-500 text-xs mt-1">{errors.barcode}</p>}
          </div>
          <div>
            <label
              htmlFor="precio_costo"
              className="block text-sm font-medium text-gray-700"
            >
              Precio Costo
            </label>
            <input
              type="number"
              id="precio_costo"
              name="precio_costo"
              value={formData.precio_costo}
              onChange={handleChange}
              placeholder="Ej: 15.50"
              className={getInputClass('precio_costo')}
              step="0.01"
            />
            {errors.precio_costo && <p className="text-red-500 text-xs mt-1">{errors.precio_costo}</p>}
          </div>
          <div>
            <label
              htmlFor="precio_venta"
              className="block text-sm font-medium text-gray-700"
            >
              Precio Venta
            </label>
            <input
              type="number"
              id="precio_venta"
              name="precio_venta"
              value={formData.precio_venta}
              onChange={handleChange}
              placeholder="Ej: 25.00"
              className={getInputClass('precio_venta')}
              step="0.01"
            />
            {errors.precio_venta && <p className="text-red-500 text-xs mt-1">{errors.precio_venta}</p>}
          </div>
        </div>
        <div className="mb-4 relative">
          <label
            htmlFor="categoria"
            className="block text-sm font-medium text-gray-700"
          >
            Categoría
          </label>
          <input
            type="text"
            id="categoria"
            name="categoria"
            value={categorySearch}
            onChange={handleCategoryChange}
            onFocus={() => setIsCategoryDropdownOpen(true)}
            onBlur={() => setTimeout(() => setIsCategoryDropdownOpen(false), 150)}
            placeholder="Buscar o ingresar categoría"
            className={getInputClass('categoria')}
            autoComplete="off"
          />
          {isCategoryDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((category) => (
                  <div
                    key={category.id}
                    onClick={() => selectCategory(category.name)}
                    className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                  >
                    {category.name}
                  </div>
                ))
              ) : (
                <div className="px-3 py-2 text-gray-500">No se encontraron categorías</div>
              )}
            </div>
          )}
          {errors.categoria && <p className="text-red-500 text-xs mt-1">{errors.categoria}</p>}
        </div>
        <div className="mb-4">
          <label
            htmlFor="descripcion"
            className="block text-sm font-medium text-gray-700"
          >
            Descripción (Opcional)
          </label>
          <textarea
            id="descripcion"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            rows="3"
            placeholder="Descripción detallada del producto (máximo 150 caracteres)"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-havelock-blue-400 focus:border-havelock-blue-400 sm:text-sm"
          ></textarea>
        </div>
        <div className="mb-6">
          <label
            htmlFor="image_upload"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Imagen del Producto (Opcional)
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="file"
              id="image_upload"
              accept="image/png, image/jpeg"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-havelock-blue-50 file:text-havelock-blue-400
                hover:file:bg-havelock-blue-100"
            />
            {imagePreview && (
              <div className="relative w-20 h-20 rounded-md overflow-hidden border border-gray-300">
                <img
                  src={imagePreview}
                  alt="Previsualización"
                  className="w-full h-full object-cover"
                />
              </div>
            )}{" "}
            {!imagePreview && (
              <div className="w-20 h-20 rounded-md border border-gray-300 flex items-center justify-center text-gray-400">
                <ImageIcon size={32} />
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors font-semibold"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!!barcodeError}
            className={`px-4 py-2 rounded-md text-white font-semibold transition-colors ${barcodeError
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-havelock-blue-400 hover:bg-havelock-blue-500"
              }`}
          >
            {product ? "Actualizar" : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ProductModal;
